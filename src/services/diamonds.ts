import { rpc } from './backend';
export interface DiamondState { fixed_diamonds: number; lucky_diamonds: number; legacy_diamonds: number; diamonds_balance: number }
export interface DiamondQuote { diamonds_amount: number; fixed_diamonds: number; lucky_diamonds: number; coins_amount: number }
export const diamondState = () => rpc<DiamondState>('wallet_diamond_state');
export const diamondPreview = (amount: number) => rpc<DiamondQuote>('preview_diamond_redemption', {p_diamonds: amount});
export const redeemDiamonds = (amount: number, requestId: string) => rpc<DiamondQuote>('redeem_diamonds', {p_diamonds: amount, p_request_id: requestId});
export const walletTitles: Record<string,string> = {
 recharge: 'شحن Coins 🪙', gift_sent: 'إرسال هدية', gift_received: 'استلام هدية — سجل قديم',
 fixed_gift_diamonds_received: 'ماس هدية ثابتة', lucky_gift_diamonds_received: 'ماس هدية حظ',
 fixed_diamonds_redeemed: 'فك ماس ثابت — 30%', lucky_diamonds_redeemed: 'فك ماس هدايا الحظ الأساسي — 30%',
 coins_from_diamond_redemption: 'Coins من فك الماس', diamond_conversion: 'تحويل ماس — سجل قديم',
};
