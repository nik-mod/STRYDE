"use client";
import { ErrorScreen } from "@/components/ErrorScreen";
export default function ErrorPage({retry}:{error:unknown;retry:()=>void}){return <ErrorScreen retry={retry}/>;}
