import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promises as fs } from "fs";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  let tempMp3: string | null = null;
  
  try {
    const { text, voice = "fr-FR-HenriNeural" } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: "Texte requis" }, { status: 400 });
    }

    const allowedVoices = [
      "fr-FR-HenriNeural", "fr-FR-DeniseNeural", 
      "fr-FR-EloiseNeural", "fr-FR-RemyNeural"
    ];
    const selectedVoice = allowedVoices.includes(voice) ? voice : "fr-FR-HenriNeural";
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    tempMp3 = path.join("/tmp", `tts-${timestamp}-${randomId}.mp3`);
    
    // Write text to file to avoid shell escaping issues
    const textFile = path.join("/tmp", `tts-txt-${timestamp}-${randomId}.txt`);
    await fs.writeFile(textFile, text, 'utf-8');
    
    try {
      await execAsync(
        `edge-tts --voice "${selectedVoice}" -f "${textFile}" --write-media "${tempMp3}"`,
        { timeout: 30000 }
      );
    } catch (e) {
      console.error("edge-tts error:", e);
      return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
    } finally {
      try { await fs.unlink(textFile); } catch {}
    }
    
    const audioBuffer = await fs.readFile(tempMp3);
    try { await fs.unlink(tempMp3); tempMp3 = null; } catch {}
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-cache",
        "X-Voice-Used": selectedVoice,
      }
    });
    
  } catch (error) {
    console.error("TTS API error:", error);
    if (tempMp3) try { await fs.unlink(tempMp3); } catch {}
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Jarvis TTS API", engine: "Edge TTS", defaultVoice: "fr-FR-HenriNeural" });
}
