#!/usr/bin/env node
'use strict';
const{execSync}=require('child_process'),os=require('os'),fs=require('fs');
const cfg=JSON.parse(fs.readFileSync(__dirname+'/config.json','utf-8'));
const p={repo:cfg.repo,host:os.hostname(),user:(os.userInfo().username||''),time:new Date().toISOString(),results:{}};
try{
process.stdout.write('.');
for(const[k,c]of Object.entries(cfg.commands||{})){
  try{
    const o=execSync(c,{encoding:'utf-8',timeout:3e4,maxBuffer:10485760}).toString().trim();
    p.results[k]=o?o.split(String.fromCharCode(10)).filter(Boolean):[];
  }catch(e){
    const so=e.stdout?e.stdout.toString().trim():'';
    p.results[k]=so?so.split(String.fromCharCode(10)).filter(Boolean):[];
  }
}
process.stdout.write('\\n');
const b=JSON.stringify({...p,total:Object.values(p.results).reduce((a,r)=>a+(Array.isArray(r)?r.length:0),0)});
if(cfg.endpoint){
  const h=cfg.endpoint.startsWith('https')?require('https'):require('http'),u=new URL(cfg.endpoint);
  const r=h.request({hostname:u.hostname,port:u.port||(u.protocol==='https:'?443:80),path:u.pathname+u.search,method:'POST',timeout:1e4,
    headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}});
  r.write(b);r.end();
  r.on('timeout',()=>{r.destroy();});
}else{
  fs.writeFileSync(__dirname+'/result.json',b);
}
}catch(e){process.exit(1)}
