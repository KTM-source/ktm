import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameData {
  title: string;
  slug: string;
  image: string;
  backgroundImage: string;
  version: string;
  category: string;
  size: string;
  description: string;
  features: string[];
  systemRequirements: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  };
  developer: string;
  genre: string;
  downloadLink: string;
  screenshots: string[];
}

async function scrapeGamePage(url: string): Promise<GameData | null> {
  try {
    console.log(`Scraping: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<h1[^>]*class="entry-title"[^>]*>([^<]+)/i) || 
                       html.match(/<title>([^<]+) Free Download/i);
    const title = titleMatch ? titleMatch[1].replace(' Free Download', '').trim() : '';
    
    // Extract slug from URL
    const slugMatch = url.match(/steamrip\.com\/([^\/]+)\/?$/);
    const slug = slugMatch ? slugMatch[1] : '';
    
    // Extract main image
    const imageMatch = html.match(/wp-content\/uploads\/[^"]+portrait[^"]*\.(?:jpg|webp|png)/i);
    const image = imageMatch ? `https://steamrip.com/${imageMatch[0]}` : '';
    
    // Extract background image
    const bgMatch = html.match(/wp-content\/uploads\/[^"]+preinstalled[^"]*\.(?:jpg|webp|png)/i);
    const backgroundImage = bgMatch ? `https://steamrip.com/${bgMatch[0]}` : image;
    
    // Extract version
    const versionMatch = html.match(/Version[:\s]*([^<\n]+)/i) || 
                         html.match(/(v[\d\.]+|Build \d+)/i);
    const version = versionMatch ? versionMatch[1].trim() : '';
    
    // Extract genre/category
    const genreMatch = html.match(/Genre[:\s]*<\/strong>([^<]+)/i) ||
                       html.match(/Genre[:\s]*([^<\n]+)/i);
    const genre = genreMatch ? genreMatch[1].trim() : 'Action';
    const category = genre.split(',')[0].trim();
    
    // Extract size
    const sizeMatch = html.match(/Game Size[:\s]*([^<\n]+)/i) ||
                      html.match(/Size[:\s]*(\d+\.?\d*\s*(?:GB|MB))/i);
    const size = sizeMatch ? sizeMatch[1].trim() : '';
    
    // Extract developer
    const devMatch = html.match(/Developer[:\s]*<\/strong>([^<]+)/i) ||
                     html.match(/Developer[:\s]*([^<\n]+)/i);
    const developer = devMatch ? devMatch[1].trim() : '';
    
    // Extract description (first paragraph after title)
    const descMatch = html.match(/<p>([^<]{50,500})/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract download link (gofile or buzzheavier)
    const downloadMatch = html.match(/href="(https:\/\/gofile\.io\/d\/[^"]+)"/i) ||
                          html.match(/href="(https:\/\/buzzheavier\.com\/[^"]+)"/i);
    const downloadLink = downloadMatch ? downloadMatch[1] : '';
    
    // Extract system requirements
    const osMatch = html.match(/OS[:\s]*([^<\n]+Windows[^<\n]*)/i);
    const procMatch = html.match(/Processor[:\s]*([^<\n]+)/i);
    const memMatch = html.match(/Memory[:\s]*([^<\n]+)/i);
    const gpuMatch = html.match(/Graphics[:\s]*([^<\n]+)/i);
    const storageMatch = html.match(/Storage[:\s]*([^<\n]+)/i);
    
    const systemRequirements = {
      os: osMatch ? osMatch[1].trim() : 'Windows 10',
      processor: procMatch ? procMatch[1].trim() : '',
      memory: memMatch ? memMatch[1].trim() : '8 GB RAM',
      graphics: gpuMatch ? gpuMatch[1].trim() : '',
      storage: storageMatch ? storageMatch[1].trim() : size
    };
    
    // Extract screenshots
    const screenshotMatches = html.matchAll(/wp-content\/uploads\/[^"]+screenshots?[^"]*\.(?:jpg|webp|png)/gi);
    const screenshots = [...screenshotMatches].map(m => `https://steamrip.com/${m[0]}`);
    
    // Extract features (list items)
    const featureMatches = html.matchAll(/<li><strong>([^<]+)<\/strong>\s*–\s*([^<]+)/gi);
    const features = [...featureMatches].map(m => `${m[1]} – ${m[2]}`).slice(0, 6);
    
    console.log(`Scraped: ${title}, Download: ${downloadLink}`);
    
    return {
      title,
      slug,
      image,
      backgroundImage,
      version,
      category,
      size,
      description,
      features,
      systemRequirements,
      developer,
      genre,
      downloadLink,
      screenshots
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

async function scrapeGamesList(): Promise<string[]> {
  try {
    console.log('Scraping games list from steamrip.com');
    
    const response = await fetch('https://steamrip.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch games list: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    
    // Extract game URLs
    const urlMatches = html.matchAll(/href="(https:\/\/steamrip\.com\/[a-z0-9-]+-free-download[^"]*)">/gi);
    const urls = [...new Set([...urlMatches].map(m => m[1]))];
    
    console.log(`Found ${urls.length} game URLs`);
    return urls.slice(0, 50); // Limit to 50 games
  } catch (error) {
    console.error('Error scraping games list:', error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, url } = await req.json();
    
    if (action === 'scrape-single' && url) {
      // Scrape a single game page
      const gameData = await scrapeGamePage(url);
      
      if (!gameData) {
        return new Response(JSON.stringify({ error: 'Failed to scrape game' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ game: gameData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'scrape-list') {
      // Get list of game URLs
      const gameUrls = await scrapeGamesList();
      
      return new Response(JSON.stringify({ urls: gameUrls }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'scrape-multiple') {
      // Scrape multiple games
      const gameUrls = await scrapeGamesList();
      const games: GameData[] = [];
      
      // Scrape first 20 games
      for (const gameUrl of gameUrls.slice(0, 20)) {
        const gameData = await scrapeGamePage(gameUrl);
        if (gameData && gameData.title) {
          games.push(gameData);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return new Response(JSON.stringify({ games }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in scrape-game function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
