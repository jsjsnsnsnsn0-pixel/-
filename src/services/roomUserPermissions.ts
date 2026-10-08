export interface RoomUserPermissions {
 room_id:string; subject_public_id:number;
 social:{follow:boolean;message:boolean;gift:boolean;mention:boolean;is_following:boolean};
 moderation:string[];manage_moderators:boolean;self:boolean;
}
export function validatedRoomPermissions(value:unknown,roomId:string,targetId:string):RoomUserPermissions|null {
 if(!value||typeof value!=='object')return null;
 const v=value as RoomUserPermissions;
 if(v.room_id!==roomId||String(v.subject_public_id)!==targetId||!v.social||!Array.isArray(v.moderation))return null;
 return {...v,social:{follow:v.social.follow===true,message:v.social.message===true,gift:v.social.gift===true,mention:v.social.mention===true,is_following:v.social.is_following===true},moderation:v.self===true?[]:v.moderation.filter(a=>['mute','unmute','down','raise','kick','ban'].includes(a)),manage_moderators:v.self!==true&&v.manage_moderators===true,self:v.self===true};
}
