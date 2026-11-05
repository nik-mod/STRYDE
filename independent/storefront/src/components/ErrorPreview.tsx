"use client";
import { ErrorScreen } from "./ErrorScreen";
export function ErrorPreview(){return <ErrorScreen retry={()=>{window.location.href="/collections/all";}}/>;}
