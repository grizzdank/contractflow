import puppeteer from 'puppeteer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateOGImage() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set viewport to match OG image dimensions
    await page.setViewport({
        width: 1200,
        height: 630,
        deviceScaleFactor: 2, // Render at 2x for better quality
    });
    
    // Load the template
    await page.goto(`file://${path.join(__dirname, '../public/og-template.html')}`);
    
    // Wait for the logo to load
    await page.waitForSelector('img.logo');
    
    // Take screenshot
    const screenshot = await page.screenshot({
        type: 'png',
        clip: {
            x: 0,
            y: 0,
            width: 1200,
            height: 630,
        },
    });
    
    await browser.close();
    
    // Optimize the image
    await sharp(screenshot)
        .png({
            quality: 90,
            compressionLevel: 9,
        })
        .toFile(path.join(__dirname, '../public/og-image.png'));
    
    console.log('OpenGraph image generated successfully!');
}

generateOGImage().catch(console.error); 