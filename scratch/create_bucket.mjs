import { createClient } from '@supabase/supabase-js';

const url = 'https://bnbscflfrnwuigouxxfc.supabase.co';
const key = 'sb_publishable_ptzvPufFtGVIA3IaK9BCdA_Hycw6wan';

const supabase = createClient(url, key);

async function testBucket() {
  console.log('Checking buckets...');
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  console.log('List buckets result:', { buckets, listErr });

  console.log('Attempting createBucket product-images...');
  const { data: createRes, error: createErr } = await supabase.storage.createBucket('product-images', {
    public: true,
  });
  console.log('Create bucket result:', { createRes, createErr });
}

testBucket();
