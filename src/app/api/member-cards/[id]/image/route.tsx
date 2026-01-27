import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch member card data
    const { data: memberCard, error } = await supabaseAdmin
      .from('member_cards')
      .select(`
        *,
        customer:customers (*),
        merchant:merchants (*)
      `)
      .eq('id', id)
      .single();

    if (error || !memberCard) {
      return new Response('Carte membre non trouvée', { status: 404 });
    }

    const isValid = new Date(memberCard.valid_until) > new Date();
    const validUntilDate = new Date(memberCard.valid_until).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const customerName = `${memberCard.customer?.first_name || ''} ${memberCard.customer?.last_name || ''}`.trim();
    const shopName = memberCard.merchant?.shop_name || 'Commerce';
    const primaryColor = memberCard.merchant?.primary_color || '#6366f1';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            padding: '40px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  backgroundColor: primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}
              >
                {shopName.charAt(0)}
              </div>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                {shopName}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: isValid ? '#dcfce7' : '#fee2e2',
                color: isValid ? '#166534' : '#991b1b',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isValid ? '#22c55e' : '#ef4444',
                }}
              />
              {isValid ? 'ACTIF' : 'EXPIRÉ'}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '8px',
            }}
          >
            Carte Membre
          </div>

          {/* Customer Name */}
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '30px',
            }}
          >
            {customerName}
          </div>

          {/* Benefit Box */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px',
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${primaryColor}, #8b5cf6)`,
              color: 'white',
              marginBottom: '30px',
            }}
          >
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Avantage exclusif
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center' }}>
              {memberCard.benefit_label}
            </div>
          </div>

          {/* Validity */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                Valide jusqu&apos;au
              </span>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                {validUntilDate}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#9ca3af',
              }}
            >
              <span>Propulsé par</span>
              <span style={{ fontWeight: 'bold', color: '#6366f1' }}>Qarte</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 500,
        height: 400,
      }
    );
  } catch (error) {
    console.error('Error generating member card image:', error);
    return new Response('Erreur lors de la génération', { status: 500 });
  }
}
