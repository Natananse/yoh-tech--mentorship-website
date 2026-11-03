import {spawn} from 'node:child_process';
const args=process.argv.slice(2);const index=args.indexOf('--port');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','0.0.0.0','--port',index>=0?args[index+1]:'3000'],{stdio:'inherit'});
child.on('exit',code=>process.exit(code??0));
