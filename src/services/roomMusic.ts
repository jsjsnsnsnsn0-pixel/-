/** Owns only a music track; microphone capture and remote audio are untouched. */
export class RoomMusicPublisher {
  private generation=0;
  private cleanup:(()=>void)|null=null;
  private audio:HTMLAudioElement|null=null;
  private context:AudioContext|null=null;
  private localGain:GainNode|null=null;
  private volume=1;
  constructor(private onChange:(name:string)=>void) {}
  setLocalVolume(volume:number) {
    this.volume=Number.isFinite(volume)?Math.max(0,Math.min(1,volume)):1;
    if(this.localGain)this.localGain.gain.value=this.volume;
  }
  stop() {this.generation++;this.cleanup?.();this.cleanup=null;this.audio=null;this.context=null;this.localGain=null;this.onChange('');}
  pause() {
    if(!this.audio)return false;
    this.audio.pause();
    return true;
  }
  async resume() {
    const audio=this.audio,context=this.context,generation=this.generation;
    if(!audio||!context)return false;
    await context.resume();
    if(generation!==this.generation)return false;
    await audio.play();
    return generation===this.generation;
  }
  async start(file:File, participant:{publishTrack:(track:MediaStreamTrack,options:Record<string,unknown>)=>Promise<unknown>;unpublishTrack:(track:MediaStreamTrack)=>Promise<unknown>}, allowed:()=>boolean) {
    this.stop();const generation=this.generation;
    if(!allowed())throw new Error('اختر مقعداً وافتح المايك قبل تشغيل الموسيقى.');
    if(!file.type.startsWith('audio/'))throw new Error('اختر ملفاً صوتياً من الهاتف.');
    const context=new AudioContext();const audio=new Audio();const url=URL.createObjectURL(file);
    this.audio=audio;this.context=context;
    audio.src=url;audio.preload='auto';
    const source=context.createMediaElementSource(audio);const output=context.createMediaStreamDestination();
    const localGain=context.createGain();this.localGain=localGain;
    localGain.gain.value=this.volume;
    // Keep the outgoing track at full volume; this slider is local monitoring only.
    source.connect(output);source.connect(localGain);localGain.connect(context.destination);
    const track=output.stream.getAudioTracks()[0];
    let cleaned=false;
    const cleanup=()=>{if(cleaned)return;cleaned=true;audio.onended=null;audio.onerror=null;audio.pause();audio.removeAttribute('src');source.disconnect();localGain.disconnect();track.stop();URL.revokeObjectURL(url);void context.close().catch(()=>{});void participant.unpublishTrack(track).catch(()=>{});if(this.audio===audio){this.audio=null;this.context=null;this.localGain=null;}};
    this.cleanup=cleanup;
    audio.onended=()=>this.stop();audio.onerror=()=>this.stop();
    try {
      await context.resume();
      if(generation!==this.generation||!allowed()){cleanup();return;}
      await participant.publishTrack(track,{name:'room-music',source:'screen_share_audio',audioPreset:{maxBitrate:128000},dtx:false});
      if(generation!==this.generation||!allowed()){cleanup();void participant.unpublishTrack(track).catch(()=>{});return;}
      await audio.play();
      if(generation!==this.generation||!allowed()){cleanup();return;}
      this.onChange(file.name);
    } catch(error){cleanup();if(generation===this.generation)this.stop();throw error;}
  }
}
