import { ImageResponse } from "next/og";
export const dynamic = "force-static";
export function GET() {
  return new ImageResponse(<div style={{display:"flex",width:"100%",height:"100%",background:"#050b15",color:"#edf8ff",padding:72,flexDirection:"column",justifyContent:"space-between"}}><div style={{display:"flex",fontSize:26,letterSpacing:5,color:"#a9dbff"}}>VEYTRONATECH</div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",flexDirection:"column",fontSize:84,lineHeight:1.08}}><span>Beyond</span><span style={{color:"#8ad1ff"}}>ordinary.</span></div><span style={{fontSize:300,color:"#aad6ed",lineHeight:1}}>V</span></div><div style={{display:"flex",fontSize:24,color:"#b1c8df"}}>Websites · AI automation · Voice workflows</div></div>,{width:1200,height:630});
}
