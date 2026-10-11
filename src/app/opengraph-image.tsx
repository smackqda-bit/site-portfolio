import { ImageResponse } from "next/og";
export const alt="SMACKQ — Digital, Reimagined.";
export const size={width:1200,height:630};
export const contentType="image/png";
export default function Image(){return new ImageResponse(<div style={{width:"100%",height:"100%",background:"#080808",color:"#f2f2f0",display:"flex",flexDirection:"column",padding:65,fontFamily:"sans-serif"}}><div style={{fontSize:22,display:"flex",justifyContent:"space-between"}}><span>SMACKQ™</span><span style={{color:"#c6ff3d"}}>INDEPENDENT DIGITAL STUDIO</span></div><div style={{fontSize:124,letterSpacing:-8,lineHeight:.95,display:"flex",flexDirection:"column",marginTop:90,fontWeight:700}}><span>DIGITAL,</span><span style={{color:"#c6ff3d"}}>REIMAGINED.</span></div><div style={{fontSize:22,marginTop:42}}>Human vision. Extraordinary digital experiences.</div></div>,size);}
