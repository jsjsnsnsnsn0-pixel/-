/** Owns only a music track; microphone capture and remote audio are untouched. */
export class RoomMusicPublisher {
  private generation=0;
  private cleanup:(()=>void)|null=null;
  private audio:HTMLAudioElement|null=null;
  private paused=false;
  constructor(private onChange:(name:string)=>void,private onPauseChange:(paused:boolean)=>void=()=>{}) {}
  stop() {
    this.generation++;
    this.cleanup?.();
    this.cleanup=null;
    this.audio=null;
    this.paused=false;
    this.onPauseChange(false);
    this.onChange('');
  }
  pause() {
    if(!this.audio||this.paused)return;
    this.audio.pause();
    this.paused=true;
    this.onPauseChange(true);
  }
  async resume() {
    if(!this.audio||!this.paused)return;
    await this.audio.play();
    this.paused=false;
    this.onPauseChange(false);
  }
  async start(file:File, participant:{publishTrack:(track:MediaStreamTrack,options:Record<string,unknown>)=>Promise<unknown>;unpublishTrack:(track:MediaStreamTrack)=>Promise<unknown>}, allowed:()=>boolean) {
    this.stop();const generation=this.generation;
    if(!allowed())throw new Error('اختر مقعداً وافتح المايك قبل تشغيل الموسيقى.');
    if(!file.type.startsWith('audio/'))throw new Error('اختر ملفاً صوتياً من الهاتف.');
    const context=new AudioContext();const audio=new Audio();const url=URL.createObjectURL(file);
    this.audio=audio;this.paused=false;this.onPauseChange(false);
    audio.src=url;audio.preload='auto';
    const source=context.createMediaElementSource(audio);const output=context.createMediaStreamDestination();
    source.connect(output);source.connect(context.destination);
    const track=output.stream.getAudioTracks()[0];
    let cleaned=false;
    const cleanup=()=>{if(cleaned)return;cleaned=true;audio.pause();audio.removeAttribute('src');source.disconnect();track.stop();URL.revokeObjectURL(url);if(this.audio===audio)this.audio=null;void context.close().catch(()=>{});void participant.unpublishTrack(track).catch(()=>{});};
    this.cleanup=cleanup;
    audio.onended=()=>this.stop();audio.onerror=()=>this.stop();
    try {
      await context.resume();
      await participant.publishTrack(track,{name:'room-music',audioPreset:{maxBitrate:128000},dtx:false});
      if(generation!==this.generation||!allowed()){cleanup();void participant.unpublishTrack(track).catch(()=>{});return;}
      await audio.play();
      if(generation!==this.generation||!allowed()){cleanup();return;}
      this.onChange(file.name);
    } catch(error){cleanup();if(generation===this.generation)this.stop();throw error;}
  }
}
