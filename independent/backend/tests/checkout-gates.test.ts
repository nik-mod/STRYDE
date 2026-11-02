import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../src/api/middlewares';
function invoke(matcher:string,environment:string,testMode:string,body:unknown={}) {
  const previous={node:process.env.NODE_ENV,test:process.env.STRYDE_TEST_MODE};
  process.env.NODE_ENV=environment;process.env.STRYDE_TEST_MODE=testMode;
  let status=200,next=false;
  const response={status(value:number){status=value;return this;},json() { return this; }};
  const handler=config.routes.find(route=>route.matcher===matcher)!.middlewares[0] as Function;
  try{handler({body},response,()=>{next=true;});return{status,next};}
  finally{process.env.NODE_ENV=previous.node;process.env.STRYDE_TEST_MODE=previous.test;}
}
test('public Medusa completion is denied in production even with test flag',()=>{
  assert.deepEqual(invoke('/store/carts/:id/complete','production','true'),{status:403,next:false});
});
test('public Medusa payment sessions are denied in production',()=>{
  assert.deepEqual(invoke('/store/payment-collections/:id/payment-sessions','production','true',{provider_id:'pp_system_default'}),{status:403,next:false});
});
test('development cannot silently select an unapproved payment provider',()=>{
  assert.deepEqual(invoke('/store/payment-collections/:id/payment-sessions','development','true',{provider_id:'pp_unapproved'}),{status:403,next:false});
  assert.deepEqual(invoke('/store/carts/:id/complete','development','false'),{status:403,next:false});
});
test('explicit local test session can reach Medusa test workflow',()=>{
  assert.deepEqual(invoke('/store/payment-collections/:id/payment-sessions','development','true',{provider_id:'pp_system_default'}),{status:200,next:true});
});
