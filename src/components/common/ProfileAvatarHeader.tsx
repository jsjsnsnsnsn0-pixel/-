import {defaultAvatar} from '../../services/profile';
import {setImageFallback} from '../../utils/imageFallback';
import wings from '../../assets/profile-ruby-wings.png';

/** One transparent header for every account; the bundled frame URL is content-hashed. */
export function ProfileAvatarHeader({avatar,name}:{avatar:string;name:string}){
 return <div className="relative flex justify-center items-center mt-1 mb-2" data-testid="profile-avatar-header" style={{backgroundColor:'transparent'}}>
  <div className="relative w-full max-w-72 h-20 flex items-center justify-center" style={{backgroundColor:'transparent'}}>
   <img src={wings} alt="" aria-hidden="true" data-testid="profile-avatar-frame" className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(239,68,68,0.4)]" onError={event=>{event.currentTarget.style.visibility='hidden'}}/>
   <div className="absolute w-16 h-16 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,215,0,0.6)] overflow-hidden bg-black flex items-center justify-center z-10">
    <img src={avatar} alt={avatar===defaultAvatar?'صورة افتراضية':name} className="w-full h-full object-cover object-center" onError={event=>{event.currentTarget.alt='صورة افتراضية';setImageFallback(event,defaultAvatar)}}/>
   </div>
  </div>
 </div>;
}
