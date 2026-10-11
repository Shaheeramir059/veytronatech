import { ImageResponse } from "next/og";
export const size = {width:180,height:180};
export const contentType = "image/png";
export default function AppleIcon() { return new ImageResponse(<div style={{display:"flex",width:"100%",height:"100%",alignItems:"center",justifyContent:"center",background:"#060d19",color:"#a9dbff",fontSize:142,fontWeight:700}}>V</div>,size); }
