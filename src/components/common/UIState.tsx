import {ReactNode} from 'react';

export function EmptyState({title,description,children}: {title:string;description?:string;children?:ReactNode}) {
  return <div className="ui-empty" dir="rtl"><p className="font-bold text-sm">{title}</p>{description&&<p className="text-xs opacity-75 mt-1 leading-relaxed">{description}</p>}{children&&<div className="mt-3">{children}</div>}</div>;
}

export function InlineLoading({children}: {children:ReactNode}) {
  return <div role="status" className="ui-inline-status"><span className="ui-spinner" aria-hidden="true"/><span>{children}</span></div>;
}

export function ErrorState({message,onRetry}: {message:string;onRetry?:()=>void}) {
  return <div role="alert" className="ui-error" dir="rtl"><p className="text-sm leading-relaxed">{message}</p>{onRetry&&<button type="button" onClick={onRetry} className="ui-control mt-2 px-3 rounded-xl border border-current text-xs font-bold">إعادة المحاولة</button>}</div>;
}
