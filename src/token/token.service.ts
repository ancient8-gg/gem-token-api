import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { OpenAI } from 'openai';

@Injectable()
export class TokenService {
  private openai: OpenAI;
  private readonly coingeckoApi: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.coingeckoApi =
      process.env.GECKO_API_URL || 'https://api.coingecko.com/api/v3';
  }

  /**
   * Fetch AI-powered agent tokens from CoinGecko
   */
  async getAiAgentTokens() {
    const tokens = await this.fetchAiAgentTokens();

    return tokens;
  }

  /**
   * Fetch token details and AI analysis
   */
  async getTokenDetails(tokenId: string) {
    const token = await this.fetchTokenDetails(tokenId);
    if (!token) return null;

    const aiAnalysis = await this.getAiAnalysis(token);

    return {
      ...token,
      ai_insight: aiAnalysis || 'No AI insight available.',
    };
  }

  /**
   * Fetch AI Agent Tokens (Market List)
   */
  private async fetchAiAgentTokens() {
    try {
      const response = await axios.get(`${this.coingeckoApi}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          category: 'ai-agents',
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false,
        },
      });
      return response.data.map(this.formatAiAgentToken);
    } catch (error) {
      console.error('Failed to fetch AI agent tokens:', error);
      return [];
    }
  }

  /**
   * Fetch Single Token Details
   */
  private async fetchTokenDetails(tokenId: string) {
    try {
      const response = await axios.get(
        `${this.coingeckoApi}/coins/${tokenId}`,
        {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: true,
          },
        },
      );
      return this.formatTokenDetails(response.data);
    } catch (error) {
      console.error(`Error fetching details for ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Format AI Agent Token Data (Market List)
   */
  private formatAiAgentToken(token: any) {
    return {
      id: token.id,
      name: token.name,
      symbol: token.symbol?.toUpperCase() || 'N/A',
      image: token.image || '',
      current_price: token.current_price || 0,
      market_cap: token.market_cap || 0,
      market_cap_rank: token.market_cap_rank || null,
      total_volume: token.total_volume || 0,
      high_24h: token.high_24h || 0,
      low_24h: token.low_24h || 0,
      price_change_24h: token.price_change_24h || 0,
      price_change_percentage_24h: token.price_change_percentage_24h || 0,
      circulating_supply: token.circulating_supply || 0,
      total_supply: token.total_supply || 0,
      max_supply: token.max_supply || null,
      ath: token.ath || 0,
      ath_change_percentage: token.ath_change_percentage || 0,
      atl: token.atl || 0,
      atl_change_percentage: token.atl_change_percentage || 0,
      last_updated: token.last_updated || 'N/A',
    };
  }

  /**
   * Format Single Token Details
   */
  private formatTokenDetails(token: any) {
    return {
      id: token.id,
      name: token.name,
      symbol: token.symbol?.toUpperCase() || 'N/A',
      image: {
        thumb: token.image?.thumb || '',
        small: token.image?.small || '',
        large: token.image?.large || '',
      },
      market_cap_rank: token.market_cap_rank || null,
      current_price: token.market_data?.current_price?.usd || 0,
      market_cap: token.market_data?.market_cap?.usd || 0,
      total_volume: token.market_data?.total_volume?.usd || 0,
      price_change_24h: token.market_data?.price_change_24h || 0,
      price_change_percentage_24h:
        token.market_data?.price_change_percentage_24h || 0,
      circulating_supply: token.market_data?.circulating_supply || 0,
      total_supply: token.market_data?.total_supply || 0,
      max_supply: token.market_data?.max_supply || null,
      ath: token.market_data?.ath?.usd || 0,
      ath_change_percentage: token.market_data?.ath_change_percentage || 0,
      ath_date: token.market_data?.ath_date || 'N/A',
      atl: token.market_data?.atl?.usd || 0,
      atl_change_percentage: token.market_data?.atl_change_percentage || 0,
      atl_date: token.market_data?.atl_date || 'N/A',
      last_updated: token.last_updated || 'N/A',
      chart_data: token.market_data?.sparkline_7d?.price?.slice(-24) || [],
    };
  }

  /**
   * Get AI Analysis for a Token
   */
  private async getAiAnalysis(token: any) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'developer',
            content:
              'You are a professional cryptocurrency analyst. Provide direct, data-driven analysis and a clear investment recommendation based on technical and market indicators. Be concise and avoid generic introductions.',
          },
          {
            role: 'user',
            content: `
      Analyze the AI-powered token **${token.name} (${token.symbol})** and provide a **concise investment recommendation**.
      
      📊 **Market Overview**:
      - **Current Price**: $${token.current_price}
      - **Market Cap**: $${token.market_cap}
      - **Market Cap Rank**: #${token.market_cap_rank}
      - **Total Volume**: $${token.total_volume}
      - **24h High/Low**: $${token.high_24h} / $${token.low_24h}
      - **24h Price Change**: $${token.price_change_24h} (${token.price_change_percentage_24h}%)
      - **ATH / ATL**: $${token.ath} (${token.ath_change_percentage}%) / $${token.atl} (${token.atl_change_percentage}%)
      - **Circulating Supply**: ${token.circulating_supply}
      - **Total Supply**: ${token.total_supply}
      - **24h Price Trend**: ${JSON.stringify(token.chart_data)}
      
      ### **💡 Investment Recommendation**
      1. **Short-Term Outlook (Next 7 Days)**: 🚀 **Bullish** or 📉 **Bearish**? Why?
      2. **Support & Resistance Levels**: Where are the key buy & sell zones?
      3. **Best Buy Zone**: What price range would be ideal for entry?
      4. **Best Sell Zone**: Where should an investor take profit?
      5. **Risk Factor**: What risks should be considered?
      6. **Final Verdict**: **Buy, Hold, or Avoid?**
      
      Provide specific numbers and avoid speculation.
                  `,
          },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error(`AI analysis failed for ${token.name}:`, error);
      return 'AI analysis unavailable.';
    }
  }
}
