/**
 * Upload NFT assets to IPFS via Pinata
 *
 * This script:
 * 1. Reads milestones-v2.csv to get all milestone data
 * 2. Uploads cursor images to IPFS
 * 3. Uploads 1/1 NFT images to IPFS
 * 4. Generates metadata JSON for each tier
 * 5. Uploads all metadata as a directory to IPFS
 * 6. Outputs the final baseURI for the NFT contract
 *
 * Usage: node scripts/upload-nft-assets.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

const CURSORS_DIR = path.join(__dirname, '../human-materials-ignore/NFT-artifacts/cursors');
const ONE_OF_ONES_DIR = path.join(__dirname, '../human-materials-ignore/NFT-artifacts/one-of-ones');
const CSV_PATH = path.join(__dirname, '../milestones-v2.csv');
const OUTPUT_DIR = path.join(__dirname, '../nft-metadata');

// Pinata endpoints
const PINATA_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_FOLDER_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

/**
 * Parse CSV file into array of milestone objects
 */
function parseCSV(csvPath) {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');

    const milestones = [];
    for (let i = 1; i < lines.length; i++) {
        // Handle CSV with potential commas in values
        const values = parseCSVLine(lines[i]);
        const milestone = {};
        headers.forEach((header, idx) => {
            milestone[header.trim()] = values[idx]?.trim() || '';
        });
        milestones.push(milestone);
    }
    return milestones;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
}

/**
 * Upload a single file to Pinata
 */
async function uploadFile(filePath, name) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const metadata = JSON.stringify({
        name: name,
        keyvalues: {
            project: 'clickstr'
        }
    });
    formData.append('pinataMetadata', metadata);

    const response = await fetch(PINATA_FILE_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PINATA_JWT}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload ${name}: ${error}`);
    }

    const result = await response.json();
    return result.IpfsHash;
}

/**
 * Upload a directory to Pinata using axios
 */
async function uploadDirectory(dirPath, name) {
    const files = fs.readdirSync(dirPath).filter(f => {
        const filePath = path.join(dirPath, f);
        return fs.statSync(filePath).isFile() && !f.startsWith('.');
    });

    console.log(`   Uploading ${files.length} files as folder...`);

    const formData = new FormData();

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        formData.append('file', fs.createReadStream(filePath), {
            filepath: `${name}/${file}`
        });
    }

    formData.append('pinataMetadata', JSON.stringify({
        name: name,
        keyvalues: { project: 'clickstr' }
    }));

    formData.append('pinataOptions', JSON.stringify({
        wrapWithDirectory: true
    }));

    try {
        const response = await axios.post(PINATA_FILE_URL, formData, {
            maxBodyLength: Infinity,
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`,
                ...formData.getHeaders()
            }
        });
        return response.data.IpfsHash;
    } catch (error) {
        if (error.response) {
            throw new Error(`Failed to upload directory ${name}: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }
}

/**
 * Map tier to cursor filename
 */
function getCursorFilename(tier, cursorName) {
    // Format: XXX_cursorName.png
    const tierStr = tier.toString().padStart(3, '0');

    // Try to find the file that matches this tier
    const files = fs.readdirSync(CURSORS_DIR);
    const match = files.find(f => f.startsWith(tierStr + '_'));

    return match || null;
}

/**
 * Map tier to 1/1 filename
 */
function getOneOfOneFilename(tier, cursorName) {
    // Format: XXX_GameName.png
    const tierStr = tier.toString();

    const files = fs.readdirSync(ONE_OF_ONES_DIR);
    const match = files.find(f => f.startsWith(tierStr + '_'));

    return match || null;
}

/**
 * Generate metadata JSON for a milestone
 */
function generateMetadata(milestone, cursorsHash, oneOfOnesHash) {
    const tier = parseInt(milestone.Tier);
    const isGlobal = tier >= 200 && tier < 500;

    // Determine image path
    let image;
    if (isGlobal) {
        const filename = getOneOfOneFilename(tier, milestone.Cursor);
        if (filename) {
            image = `ipfs://${oneOfOnesHash}/${filename}`;
        } else {
            console.warn(`  Warning: No 1/1 image found for tier ${tier}`);
            image = '';
        }
    } else {
        const filename = getCursorFilename(tier, milestone.Cursor);
        if (filename) {
            image = `ipfs://${cursorsHash}/${filename}`;
        } else {
            console.warn(`  Warning: No cursor image found for tier ${tier}`);
            image = '';
        }
    }

    // Build attributes
    const attributes = [
        { trait_type: 'Tier', value: tier },
        { trait_type: 'Type', value: milestone.Type },
        { trait_type: 'Rarity', value: milestone.Rarity },
        { trait_type: 'Edition Type', value: milestone['Edition Type'] }
    ];

    // Add trigger info
    if (milestone.Trigger) {
        attributes.push({ trait_type: 'Requirement', value: milestone.Trigger });
    }

    // Add cursor info for non-globals
    if (!isGlobal && milestone.Cursor) {
        attributes.push({ trait_type: 'Cursor', value: milestone.Cursor });
    }

    // For globals, add the arcade game name
    if (isGlobal && milestone.Cursor) {
        attributes.push({ trait_type: 'Arcade Game', value: milestone.Cursor });
    }

    const metadata = {
        name: milestone.Name,
        description: generateDescription(milestone),
        image: image,
        external_url: 'https://clickstr.xyz',
        attributes: attributes
    };

    return metadata;
}

/**
 * Generate description based on milestone type
 */
function generateDescription(milestone) {
    const tier = parseInt(milestone.Tier);

    if (tier >= 200 && tier < 500) {
        // Global 1/1
        return `A legendary 1/1 NFT awarded to the player who made ${milestone.Trigger} in Clickstr. Only one will ever exist.`;
    } else if (tier >= 100 && tier < 200) {
        // Streak/Epoch
        return `Awarded for achieving ${milestone.Trigger} in Clickstr. Unlocks the ${milestone.Cursor} cursor.`;
    } else if (tier >= 500) {
        // Hidden personal
        return `A hidden achievement for reaching ${milestone.Trigger} in Clickstr. Unlocks the ${milestone.Cursor} cursor.`;
    } else {
        // Personal milestone
        return `Achieved by reaching ${milestone.Trigger} in Clickstr. Unlocks the ${milestone.Cursor} cursor.`;
    }
}

async function main() {
    console.log('=== Clickstr NFT Asset Uploader ===\n');

    // Validate env
    if (!PINATA_JWT) {
        console.error('Error: PINATA_JWT not found in .env');
        process.exit(1);
    }

    // Parse milestones
    console.log('1. Parsing milestones CSV...');
    const milestones = parseCSV(CSV_PATH);
    console.log(`   Found ${milestones.length} milestones\n`);

    // Upload cursors directory
    console.log('2. Uploading cursors to IPFS...');
    const cursorFiles = fs.readdirSync(CURSORS_DIR).filter(f => f.endsWith('.png'));
    console.log(`   Found ${cursorFiles.length} cursor images`);
    const cursorsHash = await uploadDirectory(CURSORS_DIR, 'clickstr-cursors');
    console.log(`   Cursors uploaded: ipfs://${cursorsHash}\n`);

    // Upload 1/1s directory
    console.log('3. Uploading 1/1 NFTs to IPFS...');
    const oneOfOneFiles = fs.readdirSync(ONE_OF_ONES_DIR).filter(f => f.endsWith('.png'));
    console.log(`   Found ${oneOfOneFiles.length} one-of-one images`);
    const oneOfOnesHash = await uploadDirectory(ONE_OF_ONES_DIR, 'clickstr-one-of-ones');
    console.log(`   1/1s uploaded: ipfs://${oneOfOnesHash}\n`);

    // Generate metadata JSONs
    console.log('4. Generating metadata JSONs...');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const milestone of milestones) {
        const tier = parseInt(milestone.Tier);
        const metadata = generateMetadata(milestone, cursorsHash, oneOfOnesHash);

        // Write to file (filename is just the tier number, no extension)
        const metadataPath = path.join(OUTPUT_DIR, tier.toString());
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
    console.log(`   Generated ${milestones.length} metadata files\n`);

    // Upload metadata directory
    console.log('5. Uploading metadata to IPFS...');
    const metadataHash = await uploadDirectory(OUTPUT_DIR, 'clickstr-metadata');
    console.log(`   Metadata uploaded: ipfs://${metadataHash}\n`);

    // Output results
    console.log('=== UPLOAD COMPLETE ===\n');
    console.log('IPFS Hashes:');
    console.log(`  Cursors:    ipfs://${cursorsHash}`);
    console.log(`  1/1 NFTs:   ipfs://${oneOfOnesHash}`);
    console.log(`  Metadata:   ipfs://${metadataHash}`);
    console.log('');
    console.log('For NFT Contract deployment, use this baseURI:');
    console.log(`  ipfs://${metadataHash}/`);
    console.log('');
    console.log('Gateway URLs for testing:');
    console.log(`  https://gateway.pinata.cloud/ipfs/${metadataHash}/1`);
    console.log(`  https://gateway.pinata.cloud/ipfs/${metadataHash}/200`);

    // Save config for deploy script
    const configPath = path.join(__dirname, '../nft-ipfs-config.json');
    fs.writeFileSync(configPath, JSON.stringify({
        cursorsHash,
        oneOfOnesHash,
        metadataHash,
        baseURI: `ipfs://${metadataHash}/`,
        uploadedAt: new Date().toISOString()
    }, null, 2));
    console.log(`\nConfig saved to: nft-ipfs-config.json`);
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
