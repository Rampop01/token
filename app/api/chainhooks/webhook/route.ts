import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook endpoint to receive chainhook notifications from Hiro
 * POST /api/chainhooks/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CHAINHOOK_WEBHOOK_SECRET || 'your-secret-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the chainhook payload
    const payload = await request.json();
    
    console.log('📡 Received chainhook event:', {
      chainhookUuid: payload.chainhook?.uuid,
      eventCount: payload.apply?.length || 0,
      timestamp: new Date().toISOString(),
    });

    // Process each event in the payload
    if (payload.apply && Array.isArray(payload.apply)) {
      for (const event of payload.apply) {
        await processEvent(event);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: payload.apply?.length || 0 
    });
    
  } catch (error) {
    console.error('Error processing chainhook webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process a single chainhook event
 */
async function processEvent(event: any) {
  const eventType = event.type;
  const txId = event.transaction_identifier?.hash;
  
  console.log('Processing event:', {
    type: eventType,
    txId,
    block: event.block_identifier?.index,
  });

  // Handle different event types
  switch (eventType) {
    case 'contract_call':
      await handleContractCall(event);
      break;
    
    case 'ft_mint_event':
    case 'ft_transfer_event':
    case 'ft_burn_event':
      await handleFTEvent(event);
      break;
    
    case 'nft_mint_event':
    case 'nft_transfer_event':
    case 'nft_burn_event':
      await handleNFTEvent(event);
      break;
    
    case 'print_event':
      await handlePrintEvent(event);
      break;
    
    default:
      console.log('Unknown event type:', eventType);
  }
}

/**
 * Handle contract call events
 */
async function handleContractCall(event: any) {
  const contractId = event.contract_call?.contract_identifier;
  const functionName = event.contract_call?.function_name;
  
  console.log(`📞 Contract Call: ${contractId}.${functionName}`);
  
  // Here you could:
  // - Store the event in a database
  // - Trigger notifications
  // - Update cached data
  // - Emit real-time events to connected clients
}

/**
 * Handle fungible token events
 */
async function handleFTEvent(event: any) {
  const assetId = event.asset_identifier;
  const amount = event.amount;
  const sender = event.sender;
  const recipient = event.recipient;
  
  console.log(`🪙 FT Event: ${event.type}`, {
    asset: assetId,
    amount,
    from: sender,
    to: recipient,
  });
}

/**
 * Handle non-fungible token events
 */
async function handleNFTEvent(event: any) {
  const assetId = event.asset_identifier;
  const tokenId = event.value;
  const sender = event.sender;
  const recipient = event.recipient;
  
  console.log(`🎨 NFT Event: ${event.type}`, {
    asset: assetId,
    tokenId,
    from: sender,
    to: recipient,
  });
}

/**
 * Handle print events (contract logs)
 */
async function handlePrintEvent(event: any) {
  const contractId = event.contract_identifier;
  const value = event.value;
  
  console.log(`📢 Print Event from ${contractId}:`, value);
}

/**
 * GET endpoint to check webhook status
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/chainhooks/webhook',
    message: 'Chainhook webhook endpoint is ready to receive events',
  });
}
