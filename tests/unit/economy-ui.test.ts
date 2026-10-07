import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('production rankings expose no fabricated support controls or client increment API',async()=>{
  for(const name of ['Wealth','Charm']){
    const screen=await readFile(`src/components/screens/${name}RankingScreen.tsx`,'utf8');
    assert.doesNotMatch(screen,/50,000|50000|handleSupport|handleReceiveCharm|selectedAmount/);
    assert.match(screen,/user\.(sentGiftsCount|receivedTotal)/);
  }
  const context=await readFile('src/context/RealtimeRankingsContext.tsx','utf8');
  assert.doesNotMatch(context,/recordGiftSupport|resetRankings/);
});

test('Android Beta APK runs only on owner dispatch or validated Beta PR, never on pushes',async()=>{
  const workflow=await readFile('.github/workflows/main.yml','utf8');
  assert.match(workflow,/default: false/);
  assert.ok(workflow.includes("github.event_name == 'workflow_dispatch' && inputs.build_android == true"));
  assert.ok(workflow.includes("github.event_name == 'pull_request' && github.head_ref == 'integration/totichat-beta-20261008'"));
  assert.ok(workflow.includes('build-apk:') && workflow.includes('needs: validate'));

  assert.ok(!workflow.includes("github.event_name == 'push' && inputs.build_android"));
});
