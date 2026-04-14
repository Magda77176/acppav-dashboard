'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const DynamicCanvas = dynamic(() => Promise.resolve(Canvas), { ssr: false });

const AGENTS_DATA = [
  { name:"Jarvis", color:"#FF6B35", status:"working", task:"Orchestration", icon:"🧠", mood:"focused", role:"COO", floor:0, deskIdx:0 },
  { name:"SEO Expert", color:"#4A90D9", status:"analyzing", task:"Audit SEO", icon:"🔍", mood:"analytical", role:"SEO", floor:0, deskIdx:1 },
  { name:"Copywriter", color:"#E67E22", status:"creating", task:"Article", icon:"✏️", mood:"inspired", role:"Content", floor:0, deskIdx:2 },
  { name:"Prospection", color:"#8E44AD", status:"hunting", task:"Scan leads", icon:"📊", mood:"detective", role:"Revenue", floor:0, deskIdx:3 },
  { name:"LinkedIn", color:"#0077B5", status:"networking", task:"Messages", icon:"💬", mood:"social", role:"Outreach", floor:0, deskIdx:4 },
  { name:"Agent Sullivan", color:"#F39C12", status:"hunting", task:"Candidatures", icon:"👤", mood:"determined", role:"Freelance", floor:0, deskIdx:5 },
  { name:"Copywriter Email", color:"#27AE60", status:"idle", task:"En attente", icon:"📧", mood:"calm", role:"Cold Email", floor:1, deskIdx:6 },
  { name:"Commercial", color:"#E74C3C", status:"closing", task:"Leads dentistes", icon:"💼", mood:"confident", role:"Sales", floor:1, deskIdx:7 },
  { name:"DA UI/UX", color:"#E91E63", status:"creating", task:"Design", icon:"🎨", mood:"zen", role:"Design", floor:1, deskIdx:8 },
  { name:"Dev Web", color:"#00BCD4", status:"working", task:"Site client", icon:"💻", mood:"focused", role:"Dev", floor:1, deskIdx:9 },
  { name:"Veille", color:"#9C27B0", status:"monitoring", task:"Scan marché", icon:"👁️", mood:"alert", role:"Intel", floor:2, deskIdx:10 },
  { name:"Social Media", color:"#FF5722", status:"trending", task:"LinkedIn post", icon:"📱", mood:"energetic", role:"Social", floor:2, deskIdx:11 },
];

const STATUS_MAP: Record<string,{dot:string;label:string}> = {
  working:{dot:'🟢',label:'Actif'}, analyzing:{dot:'🟢',label:'Actif'},
  creating:{dot:'🟢',label:'Actif'}, hunting:{dot:'🟢',label:'Actif'},
  networking:{dot:'🟢',label:'Actif'}, closing:{dot:'🟢',label:'Actif'},
  monitoring:{dot:'🟡',label:'Veille'}, trending:{dot:'🟡',label:'Veille'},
  idle:{dot:'⚪',label:'Idle'}, playing:{dot:'🔵',label:'Pause'},
};

const FLOORS = [
  { id:0, name:"Open Space", icon:"💻", desc:"Desks, work stations" },
  { id:1, name:"Meeting & Bar", icon:"🍺", desc:"Salle de réunion, bar, café" },
  { id:2, name:"Chill Zone", icon:"🎮", desc:"Baby-foot, lounge, sport" },
  { id:3, name:"Rooftop", icon:"🌿", desc:"Terrasse, détente" },
];

// Shared bridges
let gSetSelected: ((n:string|null)=>void)|null = null;
let gAddLog: ((m:string)=>void)|null = null;
let gMeetingAgents: string[] = [];
let gSetMeeting: ((a:string[])=>void)|null = null;

const DESK_POS = (i:number): [number,number,number] => {
  const row = Math.floor(i/3);
  const col = i%3;
  return [col*3.5-3.5, 0, row*3-3];
};

const ZONE_TARGETS: Record<string,[number,number,number]> = {
  bar:[-8,0,-3], cafe:[-8,0,3], babyfoot:[8,0,5], lounge:[8,0,-5],
  sport:[8,0,5], reunion:[-8,0,6], rooftop:[0,0,0],
};

// Stylized round tree
function VTree({pos,h=3}:{pos:[number,number,number];h?:number}) {
  return (
    <group position={pos}>
      <mesh position={[0,h*0.3,0]}><cylinderGeometry args={[0.1,0.15,h*0.6,6]}/><meshStandardMaterial color="#5D4037"/></mesh>
      <mesh position={[0,h*0.75,0]}><sphereGeometry args={[0.8,10,8]}/><meshStandardMaterial color="#2E7D32"/></mesh>
      <mesh position={[0,h*1.05,0]}><sphereGeometry args={[0.5,8,6]}/><meshStandardMaterial color="#43A047"/></mesh>
    </group>
  );
}

// Torch
function Torch({pos}:{pos:[number,number,number]}) {
  return (
    <group position={pos}>
      <mesh position={[0,0.4,0]}><boxGeometry args={[0.12,0.8,0.12]}/><meshStandardMaterial color="#5D4037"/></mesh>
      <mesh position={[0,0.9,0]}><boxGeometry args={[0.2,0.2,0.2]}/><meshBasicMaterial color="#FFAB00"/></mesh>
      <pointLight position={[0,1.1,0]} intensity={0.4} distance={5} color="#FFAB00"/>
    </group>
  );
}

// Minecraft agent
function Agent({data,index}:{data:typeof AGENTS_DATA[0];index:number}) {
  const g = useRef<THREE.Group>(null);
  const la = useRef<THREE.Mesh>(null);
  const ra = useRef<THREE.Mesh>(null);
  const ll = useRef<THREE.Mesh>(null);
  const rl = useRef<THREE.Mesh>(null);
  const b1 = useRef<THREE.Mesh>(null);
  const b2 = useRef<THREE.Mesh>(null);
  const [vis,setVis] = useState(false);
  const off = useMemo(()=>Math.random()*Math.PI*2,[]);
  const ms = useRef({
    cur:DESK_POS(data.deskIdx), tar:DESK_POS(data.deskIdx),
    phase:'working' as string, timer:Math.random()*12+5, inM:false
  });

  useEffect(()=>{const t=setTimeout(()=>setVis(true),index*120);return()=>clearTimeout(t);},[index]);

  useFrame((s,dt)=>{
    if(!g.current||!vis) return;
    const m=ms.current, t=s.clock.elapsedTime*2+off;
    m.timer-=dt;
    if(m.timer<=0&&m.phase==='working'&&!m.inM){
      const ds=['bar','cafe','lounge'] as const;
      const d=ds[Math.floor(Math.random()*ds.length)];
      m.tar=[...ZONE_TARGETS[d]];
      m.tar[0]+=(Math.random()-0.5)*2; m.tar[2]+=(Math.random()-0.5)*2;
      m.phase='moving'; m.timer=6+Math.random()*4;
      if(gAddLog) gAddLog(`${data.icon} ${data.name} → ${d==='bar'?'🍺 Bar':d==='cafe'?'☕ Café':'🛋️ Lounge'}`);
    } else if(m.timer<=0&&m.phase==='visiting'){
      m.tar=[...DESK_POS(data.deskIdx)]; m.phase='returning'; m.timer=10+Math.random()*5;
    } else if(m.timer<=0&&m.phase==='meeting'){
      m.tar=[...DESK_POS(data.deskIdx)]; m.phase='returning'; m.timer=12; m.inM=false;
    }
    const sp=1.8*dt;
    m.cur[0]+=(m.tar[0]-m.cur[0])*sp; m.cur[2]+=(m.tar[2]-m.cur[2])*sp;
    const dx=m.tar[0]-m.cur[0],dz=m.tar[2]-m.cur[2],dist=Math.sqrt(dx*dx+dz*dz);
    if(dist<0.3){if(m.phase==='moving')m.phase='visiting';if(m.phase==='returning')m.phase='working';}
    g.current.position.set(m.cur[0],dist>0.3?Math.abs(Math.sin(t*4))*0.15:0,m.cur[2]);
    if(dist>0.3){const a=Math.atan2(dx,dz);g.current.rotation.y+=(a-g.current.rotation.y)*0.15;}
    const mv=dist>0.3, sw=Math.sin(t*(mv?5:1))*(mv?0.7:0.15);
    if(la.current)la.current.rotation.x=sw; if(ra.current)ra.current.rotation.x=-sw;
    if(ll.current)ll.current.rotation.x=-sw*0.8; if(rl.current)rl.current.rotation.x=sw*0.8;
    if(b1.current&&b2.current){
      if(m.inM){b1.current.visible=b2.current.visible=true;
        b1.current.scale.setScalar(0.08+(Math.sin(t*3)+1)*0.05);
        b2.current.scale.setScalar(0.06+(Math.cos(t*3)+1)*0.04);
      } else b1.current.visible=b2.current.visible=false;
    }
  });

  useEffect(()=>{
    const iv=setInterval(()=>{
      if(gMeetingAgents.includes(data.name)){
        const m=ms.current;
        if(!m.inM&&(m.phase==='working'||m.phase==='visiting')){
          const spots:[number,number,number][]=[[-9,0,6],[-7,0,7],[-8,0,8],[-9,0,7]];
          m.tar=[...spots[gMeetingAgents.indexOf(data.name)%4]];
          m.phase='meeting';m.timer=8;m.inM=true;
        }
      }
    },500);
    return()=>clearInterval(iv);
  },[data.name]);

  if(!vis) return null;
  const dc=new THREE.Color(data.color).multiplyScalar(0.6).getStyle();
  const sc=['working','analyzing','creating','hunting','networking','closing'].includes(data.status)?'#4CAF50':'#FFC107';
  return (
    <group ref={g} onClick={e=>{e.stopPropagation();if(gSetSelected)gSetSelected(data.name);}}>
      {/* Ground halo */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.02,0]}><circleGeometry args={[0.5,16]}/><meshBasicMaterial color={sc} transparent opacity={0.25}/></mesh>
      
      {/* === CHIBI STYLE (rounded, stylized) === */}
      {/* Head - big round (chibi proportions: big head, small body) */}
      <mesh position={[0,1.65,0]}><sphereGeometry args={[0.32,12,10]}/><meshStandardMaterial color="#FFCC99" roughness={0.7}/></mesh>
      {/* Hair - hemisphere on top */}
      <mesh position={[0,1.85,0]}><sphereGeometry args={[0.34,12,8,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={data.color}/></mesh>
      {/* Hair bangs (front fringe) */}
      <mesh position={[0,1.78,0.22]}><sphereGeometry args={[0.12,8,6]}/><meshStandardMaterial color={data.color}/></mesh>
      {/* Eyes - round cute */}
      <mesh position={[-0.1,1.67,0.28]}><sphereGeometry args={[0.05,8,6]}/><meshBasicMaterial color="#222"/></mesh>
      <mesh position={[0.1,1.67,0.28]}><sphereGeometry args={[0.05,8,6]}/><meshBasicMaterial color="#222"/></mesh>
      {/* Eye shine */}
      <mesh position={[-0.08,1.69,0.32]}><sphereGeometry args={[0.015,6,4]}/><meshBasicMaterial color="white"/></mesh>
      <mesh position={[0.12,1.69,0.32]}><sphereGeometry args={[0.015,6,4]}/><meshBasicMaterial color="white"/></mesh>
      {/* Mouth - small smile */}
      <mesh position={[0,1.58,0.3]}><sphereGeometry args={[0.03,6,4]}/><meshBasicMaterial color="#CC8866"/></mesh>

      {/* Body / Torso - capsule shape (hoodie/jacket) */}
      <mesh position={[0,1.15,0]}><capsuleGeometry args={[0.18,0.35,6,12]}/><meshStandardMaterial color={data.color} roughness={0.6}/></mesh>
      
      {/* Arms - rounded capsules */}
      <mesh ref={la} position={[-0.28,1.15,0]}><capsuleGeometry args={[0.06,0.3,4,8]}/><meshStandardMaterial color={data.color} roughness={0.6}/></mesh>
      <mesh ref={ra} position={[0.28,1.15,0]}><capsuleGeometry args={[0.06,0.3,4,8]}/><meshStandardMaterial color={data.color} roughness={0.6}/></mesh>
      {/* Hands - small spheres */}
      <mesh position={[-0.28,0.9,0]}><sphereGeometry args={[0.06,6,6]}/><meshStandardMaterial color="#FFCC99"/></mesh>
      <mesh position={[0.28,0.9,0]}><sphereGeometry args={[0.06,6,6]}/><meshStandardMaterial color="#FFCC99"/></mesh>

      {/* Legs - darker capsules (pants) */}
      <mesh ref={ll} position={[-0.1,0.55,0]}><capsuleGeometry args={[0.07,0.35,4,8]}/><meshStandardMaterial color={dc}/></mesh>
      <mesh ref={rl} position={[0.1,0.55,0]}><capsuleGeometry args={[0.07,0.35,4,8]}/><meshStandardMaterial color={dc}/></mesh>
      {/* Shoes - small rounded */}
      <mesh position={[-0.1,0.28,0.03]}><sphereGeometry args={[0.08,6,6]}/><meshStandardMaterial color="#333"/></mesh>
      <mesh position={[0.1,0.28,0.03]}><sphereGeometry args={[0.08,6,6]}/><meshStandardMaterial color="#333"/></mesh>

      {/* Chat bubbles (meeting) */}
      <mesh ref={b1} position={[0.35,2.3,0]} visible={false}><sphereGeometry args={[1,8,6]}/><meshBasicMaterial color="white"/></mesh>
      <mesh ref={b2} position={[-0.2,2.5,0.1]} visible={false}><sphereGeometry args={[1,8,6]}/><meshBasicMaterial color="#eee"/></mesh>
    </group>
  );
}

function Desk({pos,color}:{pos:[number,number,number];color:string}) {
  const sc = useRef<THREE.Mesh>(null);
  useFrame(s=>{if(sc.current)(sc.current.material as THREE.MeshStandardMaterial).emissiveIntensity=0.2+Math.sin(s.clock.elapsedTime*2)*0.15;});
  return (
    <group position={pos}>
      <mesh position={[0,0.45,0]}><boxGeometry args={[1.4,0.08,0.9]}/><meshStandardMaterial color="#BCAAA4"/></mesh>
      {[[-0.55,0.2,-0.35],[0.55,0.2,-0.35],[-0.55,0.2,0.35],[0.55,0.2,0.35]].map((p,i)=>(
        <mesh key={i} position={p as any}><boxGeometry args={[0.1,0.4,0.1]}/><meshStandardMaterial color="#795548"/></mesh>
      ))}
      <mesh ref={sc} position={[0,0.8,-0.2]}><boxGeometry args={[0.6,0.4,0.04]}/><meshStandardMaterial color="#222" emissive={color} emissiveIntensity={0.3}/></mesh>
      <mesh position={[0,0.3,0.65]}><boxGeometry args={[0.45,0.04,0.45]}/><meshStandardMaterial color={color}/></mesh>
      <mesh position={[0,0.5,0.85]}><boxGeometry args={[0.45,0.4,0.04]}/><meshStandardMaterial color={color}/></mesh>
    </group>
  );
}

// Baby foot table
function BabyFoot({pos}:{pos:[number,number,number]}) {
  const rod = useRef<THREE.Mesh>(null);
  useFrame(s=>{if(rod.current)rod.current.rotation.x=Math.sin(s.clock.elapsedTime*3)*0.5;});
  return (
    <group position={pos}>
      <mesh position={[0,0.6,0]}><boxGeometry args={[1.5,0.15,0.9]}/><meshStandardMaterial color="#1B5E20"/></mesh>
      {[[-0.6,0.3,-0.35],[0.6,0.3,-0.35],[-0.6,0.3,0.35],[0.6,0.3,0.35]].map((p,i)=>(
        <mesh key={i} position={p as any}><boxGeometry args={[0.12,0.6,0.12]}/><meshStandardMaterial color="#5D4037"/></mesh>
      ))}
      <mesh ref={rod} position={[0,0.75,0]}><boxGeometry args={[0.06,0.06,1]}/><meshStandardMaterial color="#9E9E9E" metalness={0.5}/></mesh>
      {/* Players on rod */}
      <mesh position={[-0.2,0.73,0.2]}><boxGeometry args={[0.12,0.2,0.08]}/><meshStandardMaterial color="#F44336"/></mesh>
      <mesh position={[0.2,0.73,-0.2]}><boxGeometry args={[0.12,0.2,0.08]}/><meshStandardMaterial color="#2196F3"/></mesh>
    </group>
  );
}

// Bar counter with stools
function Bar({pos}:{pos:[number,number,number]}) {
  return (
    <group position={pos}>
      <mesh position={[0,0.6,0]}><boxGeometry args={[4,1.2,0.6]}/><meshStandardMaterial color="#4E342E"/></mesh>
      <mesh position={[0,1.25,0]}><boxGeometry args={[4.2,0.08,0.7]}/><meshStandardMaterial color="#3E2723"/></mesh>
      {/* Bottles behind */}
      {[-1.5,-0.5,0.5,1.5].map((x,i)=>(
        <mesh key={i} position={[x,1.6,-0.4]}><boxGeometry args={[0.15,0.4,0.15]}/><meshStandardMaterial color={['#4CAF50','#F44336','#FF9800','#2196F3'][i]}/></mesh>
      ))}
      {/* Stools */}
      {[-1.5,-0.5,0.5,1.5].map((x,i)=>(
        <group key={`s${i}`} position={[x,0,1.2]}>
          <mesh position={[0,0.4,0]}><cylinderGeometry args={[0.2,0.15,0.08,6]}/><meshStandardMaterial color="#795548"/></mesh>
          <mesh position={[0,0.2,0]}><cylinderGeometry args={[0.05,0.05,0.4,4]}/><meshStandardMaterial color="#9E9E9E"/></mesh>
        </group>
      ))}
    </group>
  );
}

// Beanbag
function Beanbag({pos,color}:{pos:[number,number,number];color:string}) {
  return (
    <group position={pos}>
      <mesh position={[0,0.25,0]}><boxGeometry args={[0.8,0.5,0.8]}/><meshStandardMaterial color={color}/></mesh>
      <mesh position={[0,0.55,-0.2]}><boxGeometry args={[0.8,0.3,0.3]}/><meshStandardMaterial color={color}/></mesh>
    </group>
  );
}

function PunchBag() {
  const m=useRef<THREE.Mesh>(null);
  useFrame(s=>{if(m.current)m.current.rotation.z=Math.sin(s.clock.elapsedTime*2)*0.15;});
  return <mesh ref={m} position={[10,1,3]}><boxGeometry args={[0.5,1,0.5]}/><meshStandardMaterial color="#B71C1C"/></mesh>;
}

function CoffeeSteam({pos}:{pos:[number,number,number]}) {
  const p=useRef<THREE.Group>(null);
  const d=useRef([{y:0,o:1},{y:0.3,o:0.7}]);
  useFrame((_,dt)=>{if(!p.current)return;d.current.forEach((s,i)=>{
    s.y+=0.5*dt;s.o-=0.3*dt;if(s.o<=0){s.y=0;s.o=1;}
    const c=p.current!.children[i] as THREE.Mesh;
    if(c){c.position.y=s.y;(c.material as THREE.MeshBasicMaterial).opacity=s.o*0.5;}
  });});
  return (
    <group ref={p} position={pos}>
      <mesh><boxGeometry args={[0.08,0.08,0.08]}/><meshBasicMaterial color="white" transparent opacity={0.5}/></mesh>
      <mesh position={[0.04,0.3,0]}><boxGeometry args={[0.06,0.06,0.06]}/><meshBasicMaterial color="white" transparent opacity={0.4}/></mesh>
    </group>
  );
}

function DataParticles() {
  const g=useRef<THREE.Group>(null);
  const os=useMemo(()=>Array.from({length:5},()=>({x:(Math.random()-0.5)*16,z:(Math.random()-0.5)*12,s:0.3+Math.random()*0.4,p:Math.random()*6})),[]);
  useFrame(s=>{if(!g.current)return;g.current.children.forEach((c,i)=>{
    c.position.y=3.5+Math.sin(s.clock.elapsedTime*os[i].s+os[i].p)*0.6;
    c.position.x=os[i].x+Math.sin(s.clock.elapsedTime*0.2+os[i].p)*0.8;
  });});
  return (
    <group ref={g}>
      {os.map((o,i)=><mesh key={i} position={[o.x,3.5,o.z]}><boxGeometry args={[0.06,0.06,0.06]}/><meshBasicMaterial color={i%2?'#81C784':'#4FC3F7'} transparent opacity={0.5}/></mesh>)}
    </group>
  );
}

function MeetingScheduler() {
  useEffect(()=>{
    const go=()=>{
      const n=Math.random()>0.5?3:2;
      const p=[...AGENTS_DATA].sort(()=>Math.random()-0.5).slice(0,n).map(a=>a.name);
      if(gSetMeeting)gSetMeeting(p);
      if(gAddLog)gAddLog(`💬 Réunion: ${p.join(' + ')}`);
      setTimeout(()=>{if(gSetMeeting)gSetMeeting([]);},8000);
    };
    const iv=setInterval(go,28000+Math.random()*10000);
    const f=setTimeout(go,12000);
    return()=>{clearInterval(iv);clearTimeout(f);};
  },[]);
  return null;
}

// Base structure shared across floors
function Building() {
  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.01,0]}><planeGeometry args={[50,40]}/><meshStandardMaterial color="#4CAF50"/></mesh>
      <mesh position={[0,-0.3,0]}><boxGeometry args={[50,0.5,40]}/><meshStandardMaterial color="#795548"/></mesh>
      {/* Wood floor */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}><planeGeometry args={[26,20]}/><meshStandardMaterial color="#D7CCC8" roughness={0.8}/></mesh>
      <mesh position={[0,0.04,0]}><boxGeometry args={[26.2,0.04,20.2]}/><meshStandardMaterial color="#A1887F"/></mesh>
      {/* Walls */}
      <mesh position={[0,2,-10]}><boxGeometry args={[26,4,0.4]}/><meshStandardMaterial color="#EEEEEE"/></mesh>
      <mesh position={[-13,2,0]}><boxGeometry args={[0.4,4,20]}/><meshStandardMaterial color="#E0E0E0"/></mesh>
      <mesh position={[13,2,0]}><boxGeometry args={[0.4,4,20]}/><meshStandardMaterial color="#E0E0E0"/></mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI/2,0,0]} position={[0,4,0]}><planeGeometry args={[26,20]}/><meshStandardMaterial color="#F5F5F5"/></mesh>
      {/* Glass front wall (partial) */}
      <mesh position={[0,2,10]}><boxGeometry args={[26,4,0.1]}/><meshStandardMaterial color="#B3E5FC" transparent opacity={0.15}/></mesh>
    </>
  );
}

// Floor 0: Open Space
function FloorOpenSpace() {
  const agents = AGENTS_DATA.filter(a=>a.floor===0);
  return (
    <>
      <Building />
      {agents.map((a,i)=><Desk key={i} pos={DESK_POS(i)} color={a.color}/>)}
      {/* Plants */}
      <group position={[-10,0,-8]}><mesh position={[0,0.2,0]}><boxGeometry args={[0.4,0.4,0.4]}/><meshStandardMaterial color="#6D4C41"/></mesh><mesh position={[0,0.7,0]}><boxGeometry args={[0.3,0.6,0.3]}/><meshStandardMaterial color="#388E3C"/></mesh></group>
      <group position={[10,0,-8]}><mesh position={[0,0.2,0]}><boxGeometry args={[0.4,0.4,0.4]}/><meshStandardMaterial color="#6D4C41"/></mesh><mesh position={[0,0.7,0]}><boxGeometry args={[0.3,0.6,0.3]}/><meshStandardMaterial color="#388E3C"/></mesh></group>
      <Torch pos={[-12,0,0]} /><Torch pos={[12,0,0]} />
      <DataParticles />
      {agents.map((a,i)=><Agent key={a.name} data={a} index={i}/>)}
    </>
  );
}

// Floor 1: Meeting & Bar
function FloorMeetingBar() {
  const agents = AGENTS_DATA.filter(a=>a.floor===1);
  return (
    <>
      <Building />
      {/* Bar area */}
      <Bar pos={[-6,0,-5]} />
      <CoffeeSteam pos={[-4,1.5,-5]} />
      {/* Coffee machine */}
      <mesh position={[-9,0.6,-5]}><boxGeometry args={[0.5,0.7,0.4]}/><meshStandardMaterial color="#424242" metalness={0.3}/></mesh>
      <CoffeeSteam pos={[-9,1,-5]} />
      {/* Meeting room (glass partition) */}
      <mesh position={[0,1.5,2]}><boxGeometry args={[0.1,3,12]}/><meshStandardMaterial color="#B3E5FC" transparent opacity={0.2}/></mesh>
      {/* Big table */}
      <mesh position={[6,0.7,3]}><cylinderGeometry args={[2,2,0.08,8]}/><meshStandardMaterial color="#ECEFF1"/></mesh>
      <mesh position={[6,0.35,3]}><cylinderGeometry args={[0.15,0.15,0.7,4]}/><meshStandardMaterial color="#757575"/></mesh>
      {/* Chairs around table */}
      {[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3;return(
        <group key={i} position={[6+Math.cos(a)*2.5,0,3+Math.sin(a)*2.5]}>
          <mesh position={[0,0.3,0]}><boxGeometry args={[0.4,0.04,0.4]}/><meshStandardMaterial color={AGENTS_DATA[i]?.color||'#888'}/></mesh>
          <mesh position={[0,0.5,-0.18]}><boxGeometry args={[0.4,0.35,0.04]}/><meshStandardMaterial color={AGENTS_DATA[i]?.color||'#888'}/></mesh>
        </group>
      );})}
      {/* Whiteboard */}
      <mesh position={[12.5,2,3]}><boxGeometry args={[0.1,1.5,2.5]}/><meshStandardMaterial color="#FAFAFA"/></mesh>
      {/* TV screen */}
      <mesh position={[12.5,2.5,-3]}><boxGeometry args={[0.1,1,1.5]}/><meshStandardMaterial color="#111" emissive="#2196F3" emissiveIntensity={0.2}/></mesh>
      <Torch pos={[-12,0,5]} /><Torch pos={[12,0,-7]} />
      {agents.map((a,i)=><Agent key={a.name} data={a} index={i+6}/>)}
      <MeetingScheduler />
    </>
  );
}

// Floor 2: Chill Zone
function FloorChill() {
  const agents = AGENTS_DATA.filter(a=>a.floor===2);
  return (
    <>
      <Building />
      {/* Baby foot! */}
      <BabyFoot pos={[-5,0,0]} />
      <BabyFoot pos={[-5,0,3]} />
      {/* Arcade machine style */}
      <mesh position={[-9,0.8,0]}><boxGeometry args={[0.6,1.6,0.5]}/><meshStandardMaterial color="#1A237E"/></mesh>
      <mesh position={[-9,1.3,0.26]}><boxGeometry args={[0.5,0.4,0.01]}/><meshStandardMaterial color="#111" emissive="#00E676" emissiveIntensity={0.4}/></mesh>
      {/* Lounge area */}
      <Beanbag pos={[5,0,-5]} color="#F44336" />
      <Beanbag pos={[7,0,-5]} color="#2196F3" />
      <Beanbag pos={[6,0,-3]} color="#FF9800" />
      {/* Coffee table */}
      <mesh position={[6,0.25,-4.5]}><boxGeometry args={[1,0.05,0.6]}/><meshStandardMaterial color="#795548"/></mesh>
      {/* Sport zone */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[9,0.02,4]}><planeGeometry args={[4,4]}/><meshStandardMaterial color="#37474F"/></mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[8,0.03,4]}><planeGeometry args={[1,2.5]}/><meshStandardMaterial color="#7B1FA2"/></mesh>
      <PunchBag />
      <mesh position={[10,0.3,2]}><boxGeometry args={[1,0.6,0.3]}/><meshStandardMaterial color="#424242" metalness={0.3}/></mesh>
      {/* Hammock (simplified) */}
      <mesh position={[5,0.8,5]}><boxGeometry args={[0.1,1.6,0.1]}/><meshStandardMaterial color="#5D4037"/></mesh>
      <mesh position={[8,0.8,5]}><boxGeometry args={[0.1,1.6,0.1]}/><meshStandardMaterial color="#5D4037"/></mesh>
      <mesh position={[6.5,0.5,5]} rotation={[0,0,0.05]}><boxGeometry args={[3,0.05,0.8]}/><meshStandardMaterial color="#FDD835"/></mesh>
      <Torch pos={[-12,0,-5]} /><Torch pos={[12,0,-5]} />
      {agents.map((a,i)=><Agent key={a.name} data={a} index={i+10}/>)}
    </>
  );
}

// Floor 3: Rooftop
function FloorRooftop() {
  return (
    <>
      {/* Open air - no ceiling */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.01,0]}><planeGeometry args={[50,40]}/><meshStandardMaterial color="#4CAF50"/></mesh>
      <mesh position={[0,-0.3,0]}><boxGeometry args={[50,0.5,40]}/><meshStandardMaterial color="#795548"/></mesh>
      {/* Rooftop deck */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0.01,0]}><planeGeometry args={[20,16]}/><meshStandardMaterial color="#BCAAA4" roughness={0.9}/></mesh>
      {/* Railing */}
      <mesh position={[0,0.5,-8]}><boxGeometry args={[20,1,0.1]}/><meshStandardMaterial color="#9E9E9E" transparent opacity={0.4}/></mesh>
      <mesh position={[-10,0.5,0]}><boxGeometry args={[0.1,1,16]}/><meshStandardMaterial color="#9E9E9E" transparent opacity={0.4}/></mesh>
      <mesh position={[10,0.5,0]}><boxGeometry args={[0.1,1,16]}/><meshStandardMaterial color="#9E9E9E" transparent opacity={0.4}/></mesh>
      {/* Trees & plants */}
      <VTree pos={[-7,0,-5]} h={2} /><VTree pos={[7,0,-5]} h={2.5} /><VTree pos={[0,0,6]} h={3} />
      <VTree pos={[-15,0,-12]} /><VTree pos={[15,0,-12]} /><VTree pos={[-15,0,10]} /><VTree pos={[15,0,10]} />
      {/* Parasol */}
      <mesh position={[-4,2,0]}><boxGeometry args={[0.1,2.5,0.1]}/><meshStandardMaterial color="#795548"/></mesh>
      <mesh position={[-4,3,0]}><boxGeometry args={[2.5,0.05,2.5]}/><meshStandardMaterial color="#FF7043"/></mesh>
      {/* Table under parasol */}
      <mesh position={[-4,0.45,0]}><boxGeometry args={[1.2,0.06,0.8]}/><meshStandardMaterial color="#BCAAA4"/></mesh>
      {/* Beanbags */}
      <Beanbag pos={[3,0,0]} color="#4CAF50" />
      <Beanbag pos={[5,0,1]} color="#FF9800" />
      {/* BBQ */}
      <mesh position={[7,0.5,-3]}><boxGeometry args={[0.8,0.6,0.5]}/><meshStandardMaterial color="#333"/></mesh>
      <CoffeeSteam pos={[7,1,-3]} />
      {/* String lights */}
      {[-6,-3,0,3,6].map(x=>(
        <mesh key={x} position={[x,3.5,0]}><boxGeometry args={[0.1,0.1,0.1]}/><meshBasicMaterial color="#FFEB3B"/></mesh>
      ))}
      <Torch pos={[-8,0,6]} /><Torch pos={[8,0,6]} />
    </>
  );
}

const FLOOR_COMPONENTS = [FloorOpenSpace, FloorMeetingBar, FloorChill, FloorRooftop];

function Scene({floor}:{floor:number}) {
  const Floor = FLOOR_COMPONENTS[floor];
  return (
    <>
      <ambientLight intensity={floor===3?0.6:0.4} color={floor===3?"#FFF8E1":"#FFFFFF"} />
      <directionalLight position={[15,25,10]} intensity={floor===3?1.8:1.2} color="#FFF8DC" />
      <hemisphereLight args={[floor===3?'#87CEEB':'#E3F2FD','#4E342E',floor===3?0.5:0.2]} />
      <Floor />
      <OrbitControls enablePan enableZoom enableRotate enableDamping
        dampingFactor={0.05} minDistance={8} maxDistance={45}
        minPolarAngle={0.2} maxPolarAngle={1.4} target={[0,1,0]} />
    </>
  );
}

export default function OfficePage() {
  const [loaded,setLoaded] = useState(false);
  const [floor,setFloor] = useState(0);
  const [selected,setSelected] = useState<string|null>(null);
  const [logs,setLogs] = useState<string[]>([]);
  const [meetingAgents,setMeetingAgents] = useState<string[]>([]);

  useEffect(()=>{
    gSetSelected=setSelected;
    gAddLog=(m:string)=>setLogs(p=>[m,...p].slice(0,5));
    gSetMeeting=setMeetingAgents;
    return()=>{gSetSelected=null;gAddLog=null;gSetMeeting=null;};
  },[]);
  useEffect(()=>{gMeetingAgents=meetingAgents;},[meetingAgents]);

  const sa=selected?AGENTS_DATA.find(a=>a.name===selected):null;
  const st=sa?(STATUS_MAP[sa.status]||{dot:'⚪',label:'?'}):null;

  return (
    <div style={{width:'100%',height:'100vh',position:'relative'}}>
      {!loaded&&(
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',
          zIndex:20,background:'linear-gradient(135deg,#667eea,#764ba2)',color:'#fff',fontFamily:'system-ui',fontSize:18}}>✨ Loading Jarvis HQ...</div>
      )}
      <DynamicCanvas
        camera={{fov:50,position:[20,16,20]}}
        gl={{antialias:true,powerPreference:'low-power'}}
        onCreated={({gl})=>{
          gl.setClearColor(floor===3?'#87CEEB':'#B3E5FC');
          gl.shadowMap.enabled=false;
          gl.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
          setLoaded(true);
        }}
      >
        <Scene floor={floor} />
      </DynamicCanvas>

      {/* Top bar */}
      <div style={{
        position:'absolute',top:0,left:0,right:0,height:44,
        background:'rgba(20,20,35,0.92)',display:'flex',alignItems:'center',
        padding:'0 16px',zIndex:10,borderBottom:'1px solid rgba(255,255,255,0.1)',fontFamily:'system-ui',
        backdropFilter:'blur(12px)',
      }}>
        <span style={{color:'#FF6B35',fontWeight:'bold',fontSize:15}}>🏢 JARVIS HQ</span>
        <span style={{color:'#888',fontSize:11,marginLeft:12}}>{FLOORS[floor]?.icon} {FLOORS[floor]?.name}</span>
        {meetingAgents.length>0&&floor===1&&(
          <span style={{color:'#E91E63',fontSize:11,marginLeft:12,fontWeight:'bold',animation:'pulse 1s infinite'}}>💬 Réunion en cours</span>
        )}
        <span style={{color:'#4CAF50',fontSize:11,marginLeft:'auto',fontWeight:'bold'}}>
          🟢 {AGENTS_DATA.filter(a=>['working','analyzing','creating','hunting','networking','closing'].includes(a.status)).length} actifs
        </span>
      </div>

      {/* Floor selector - LEFT */}
      <div style={{
        position:'absolute',top:52,left:8,zIndex:10,fontFamily:'monospace',
        display:'flex',flexDirection:'column',gap:4,
      }}>
        {FLOORS.map(f=>(
          <button key={f.id} onClick={()=>{setFloor(f.id);setSelected(null);}} style={{
            background:floor===f.id?'rgba(255,107,53,0.9)':'rgba(20,20,35,0.85)',
            color:floor===f.id?'#fff':'#ccc',
            border:floor===f.id?'2px solid #FF6B35':'1px solid rgba(255,255,255,0.1)',
            borderRadius:10,padding:'8px 12px',cursor:'pointer',
            fontSize:11,fontWeight:'bold',textAlign:'left',fontFamily:'system-ui',
            minWidth:160,backdropFilter:'blur(8px)',
            transition:'all 0.2s',
          }}>
            <span style={{fontSize:16,marginRight:6}}>{f.icon}</span>
            {f.name}
            <div style={{fontSize:8,fontWeight:'normal',color:floor===f.id?'#555':'#777',marginTop:2}}>
              {f.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Agent popup */}
      {sa&&st&&(
        <div style={{
          position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
          background:'rgba(25,25,40,0.95)',borderRadius:16,padding:24,zIndex:30,
          boxShadow:`0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px ${sa.color}40`,fontFamily:'system-ui',
          minWidth:280,border:`2px solid ${sa.color}`,color:'#fff',backdropFilter:'blur(16px)',
        }}>
          <button onClick={()=>setSelected(null)} style={{
            position:'absolute',top:6,right:10,background:'none',border:'none',
            fontSize:16,cursor:'pointer',color:'#999',fontFamily:'monospace'}}>✕</button>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <span style={{fontSize:28}}>{sa.icon}</span>
            <div>
              <div style={{fontWeight:'bold',fontSize:16,color:sa.color}}>{sa.name}</div>
              <div style={{color:'#888',fontSize:11}}>{sa.role}</div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div style={{background:'#3a3a3a',borderRadius:3,padding:'8px 10px'}}>
              <div style={{fontSize:9,color:'#888'}}>STATUS</div><div style={{fontSize:12}}>{st.dot} {st.label}</div>
            </div>
            <div style={{background:'#3a3a3a',borderRadius:3,padding:'8px 10px'}}>
              <div style={{fontSize:9,color:'#888'}}>MOOD</div><div style={{fontSize:12}}>{sa.mood}</div>
            </div>
            <div style={{background:'#3a3a3a',borderRadius:3,padding:'8px 10px',gridColumn:'1/3'}}>
              <div style={{fontSize:9,color:'#888'}}>TÂCHE</div><div style={{fontSize:12}}>{sa.task}</div>
            </div>
            <div style={{background:'#3a3a3a',borderRadius:3,padding:'8px 10px',gridColumn:'1/3'}}>
              <div style={{fontSize:9,color:'#888'}}>ÉTAGE</div><div style={{fontSize:12}}>{FLOORS[sa.floor]?.icon} {FLOORS[sa.floor]?.name}</div>
            </div>
          </div>
          {meetingAgents.includes(sa.name)&&(
            <div style={{marginTop:8,padding:'6px 10px',background:'#4a2020',borderRadius:3,fontSize:11,color:'#ff8a80'}}>
              💬 Réunion: {meetingAgents.filter(n=>n!==sa.name).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Dashboard */}
      <div style={{
        position:'absolute',top:52,right:8,width:240,
        background:'rgba(20,20,35,0.9)',borderRadius:12,
        fontFamily:'system-ui',zIndex:10,
        maxHeight:'calc(100vh - 60px)',overflowY:'auto',
        border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(12px)',
      }}>
        <div style={{padding:'10px 12px',borderBottom:'2px solid #444'}}>
          <div style={{fontWeight:'bold',fontSize:12,color:'#fff'}}>📊 Monitoring</div>
          <div style={{display:'flex',gap:8,marginTop:6}}>
            {[
              {v:AGENTS_DATA.filter(a=>['working','analyzing','creating','hunting','networking','closing'].includes(a.status)).length,l:'ACT',c:'#4CAF50'},
              {v:AGENTS_DATA.filter(a=>['monitoring','trending'].includes(a.status)).length,l:'VEI',c:'#FFC107'},
              {v:AGENTS_DATA.filter(a=>a.floor===floor).length,l:'ICI',c:'#2196F3'},
              {v:AGENTS_DATA.length,l:'TOT',c:'#fff'},
            ].map(({v,l,c})=>(
              <div key={l} style={{textAlign:'center',flex:1}}>
                <div style={{fontSize:15,fontWeight:'bold',color:c}}>{v}</div>
                <div style={{fontSize:8,color:'#888'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {logs.length>0&&(
          <div style={{padding:'6px 12px',borderBottom:'2px solid #444'}}>
            <div style={{fontSize:8,fontWeight:'bold',color:'#888',letterSpacing:1,marginBottom:3}}>LOG</div>
            {logs.map((l,i)=><div key={i} style={{fontSize:9,color:i===0?'#ccc':'#666',padding:'1px 0'}}>{l}</div>)}
          </div>
        )}
        <div style={{padding:'4px 0'}}>
          {AGENTS_DATA.map(a=>{
            const s=STATUS_MAP[a.status]||{dot:'⚪',label:'?'};
            const inM=meetingAgents.includes(a.name);
            const onFloor=a.floor===floor;
            return (
              <div key={a.name} onClick={()=>{setSelected(a.name);if(a.floor!==floor)setFloor(a.floor);}} style={{
                display:'flex',alignItems:'center',gap:6,
                padding:'5px 12px',fontSize:10,cursor:'pointer',color:onFloor?'#ddd':'#666',
                borderLeft:`3px solid ${onFloor?a.color:'#444'}`,
                background:inM?'rgba(255,87,34,0.15)':'transparent',
              }}>
                <span style={{fontSize:12}}>{a.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:'bold',color:onFloor?a.color:'#666',fontSize:10}}>{a.name}</div>
                  <div style={{color:'#666',fontSize:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {inM?'En réunion...':a.task}
                  </div>
                </div>
                <span style={{fontSize:9}}>{inM?'💬':s.dot}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
