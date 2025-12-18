import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { sender } = await request.json();
    console.log('All-polls endpoint called');
    
    // Get poll count first
    const countResponse = await fetch(
      'https://api.testnet.hiro.so/v2/contracts/call-read/ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G/Blackadam-vote-contract/get-poll-count',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: sender || 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G',
          arguments: [],
        }),
      }
    );

    if (!countResponse.ok) {
      const text = await countResponse.text();
      console.error('Hiro API error (count):', countResponse.status, text);
      return NextResponse.json({ error: 'Failed to get poll count', details: text }, { status: countResponse.status });
    }

    const countData = await countResponse.json();
    console.log('Count data:', countData);
    
    // Parse Clarity uint from response
    // Format: 0x07 (response-ok) + 0x01 (uint) + 32 hex chars (16 bytes big-endian)
    // We need the last byte(s) which represent the actual number
    const result = countData.result;
    // Remove 0x0701 prefix, take last few bytes
    const hexWithoutPrefix = result.replace('0x0701', '');
    const count = parseInt(hexWithoutPrefix, 16);
    console.log('Hex without prefix:', hexWithoutPrefix);
    console.log('Poll count:', count);
    
    if (count === 0) {
      return NextResponse.json({ polls: [], count: 0 });
    }

    // Fetch all polls in parallel
    const pollPromises = [];
    for (let i = 0; i < count; i++) {
      const pollIdHex = i.toString(16).padStart(32, '0');
      const clarityUint = `0x01${pollIdHex}`;
      
      pollPromises.push(
        fetch(
          'https://api.testnet.hiro.so/v2/contracts/call-read/ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G/Blackadam-vote-contract/get-poll',
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              sender: sender || 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G',
              arguments: [clarityUint],
            }),
          }
        ).then(res => res.json()).catch(err => ({ error: err.message, pollId: i }))
      );
    }

    const pollResults = await Promise.all(pollPromises);
    console.log(`Fetched ${pollResults.length} polls`);
    console.log('Poll results:', JSON.stringify(pollResults, null, 2));
    
    return NextResponse.json({
      count,
      polls: pollResults
    });
  } catch (error) {
    console.error('Failed to fetch all polls:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch polls', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
