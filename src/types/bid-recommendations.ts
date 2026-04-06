/** Bid Recommendations types — Story 86.1 */

export interface BidRecommendationLevels {
  competitive: number
  leaders: number
  top2: number
}

export interface KeywordBidRange {
  keyword: string
  minBid: number
  maxBid: number
  recommendedBid: number
}

export interface BidRecommendationsResponse {
  advertId: number
  nmId: number
  recommendations: BidRecommendationLevels
  keywords?: KeywordBidRange[]
  cachedAt?: string
}

export interface BidRecommendationsParams {
  cabinetId: string
  advertId: number
  nmId: number
}
