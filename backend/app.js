require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { Pinecone } = require('@pinecone-database/pinecone');
const pdf = require('pdf-parse');
const csv = require('csv-parser');
const mammoth = require('mammoth'); // For .docx files
const textract = require('textract'); // For various document formats (.doc, .ppt, .pptx, etc.)
const XLSX = require('xlsx'); // For Excel files (.xlsx, .xls)
const { v4: uuidv4 } = require('uuid');
const stream = require('stream');
const readline = require('readline');
// Web scraping dependencies
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { URL } = require('url');
//DOCUMENT CLUSTERING FUNCTIONALITY
const { kmeans } = require('ml-kmeans');
const cosineSimilarity = require('cosine-similarity');
// Configuration du serveur Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      '.pdf', '.txt', '.docx', '.doc',     // Documents
      '.csv', '.xlsx', '.xls',             // Spreadsheets
      '.ppt', '.pptx',                     // Presentations
      '.rtf', '.odt',                      // Other text formats
      '.json', '.xml'                      // Data formats
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté: ${ext}. Types supportés: ${allowedTypes.join(', ')}`), false);
    }
  }
});

// Initialisation des clients
let supabase;
let pinecone;
let pineconeIndex;
let browserInstance;

// Configuration Supabase
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

// Configuration Pinecone
const initializePinecone = async () => {
  try {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);
    console.log('✅ Pinecone initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Pinecone:', error);
  }
};

// Configuration Puppeteer (pour le scraping avancé)
const initializeBrowser = async () => {
  try {
    browserInstance = await puppeteer.launch({
      headless: 'new', // Use new headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    console.log('✅ Puppeteer initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Puppeteer:', error);
  }
};

// ============= WEB SCRAPING FUNCTIONS =============

// Fonction pour valider et normaliser l'URL
const validateAndNormalizeUrl = (url) => {
  try {
    // Ajouter http:// si aucun protocole n'est spécifié
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const parsedUrl = new URL(url);

    // Vérifier que c'est bien http ou https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Seuls les protocoles HTTP et HTTPS sont supportés');
    }

    return parsedUrl.href;
  } catch (error) {
    throw new Error(`URL invalide: ${error.message}`);
  }
};

// Fonction pour extraire le texte avec Cheerio (scraping simple)
const scrapeWithCheerio = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024, // 50MB max
      maxBodyLength: 50 * 1024 * 1024
    });

    const $ = cheerio.load(response.data);

    // Supprimer les scripts et styles
    $('script, style, nav, footer, aside, .advertisement, .ads, .sidebar').remove();

    // Extraire le titre
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Page sans titre';

    // Extraire le contenu principal
    let content = '';

    // Essayer d'extraire le contenu principal en ordre de préférence
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      '.article-content'
    ];

    let mainContent = null;
    for (const selector of contentSelectors) {
      mainContent = $(selector);
      if (mainContent.length > 0) {
        break;
      }
    }

    if (mainContent && mainContent.length > 0) {
      content = mainContent.text();
    } else {
      // Fallback: extraire tout le body
      content = $('body').text();
    }

    // Nettoyer le texte
    content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

    return {
      title,
      content,
      url,
      method: 'cheerio'
    };
  } catch (error) {
    throw new Error(`Erreur lors du scraping Cheerio: ${error.message}`);
  }
};

// Fonction pour extraire le texte avec Puppeteer (scraping avancé)
// Fixed Puppeteer scraping function
const scrapeWithPuppeteer = async (url) => {
  let page;
  try {
    if (!browserInstance) {
      throw new Error('Puppeteer n\'est pas initialisé');
    }

    page = await browserInstance.newPage();

    // Configurer la page
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });

    // Bloquer les ressources inutiles pour accélérer le chargement
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Charger la page avec timeout plus court
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // FIXED: Use setTimeout with Promise instead of page.waitForTimeout
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extraire le contenu
    const result = await page.evaluate(() => {
      // Supprimer les éléments inutiles
      const elementsToRemove = document.querySelectorAll('script, style, nav, footer, aside, .advertisement, .ads, .sidebar, .header, .menu');
      elementsToRemove.forEach(el => el.remove());

      // Extraire le titre
      const title = document.querySelector('title')?.textContent?.trim() ||
          document.querySelector('h1')?.textContent?.trim() ||
          'Page sans titre';

      // Extraire le contenu principal
      const contentSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.content',
        '.main-content',
        '.post-content',
        '.entry-content',
        '.article-content'
      ];

      let content = '';
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = element.textContent || element.innerText;
          break;
        }
      }

      // Fallback: extraire tout le body
      if (!content) {
        content = document.body.textContent || document.body.innerText;
      }

      // Nettoyer le texte
      content = content
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();

      return { title, content };
    });

    return {
      ...result,
      url,
      method: 'puppeteer'
    };

  } catch (error) {
    throw new Error(`Erreur lors du scraping Puppeteer: ${error.message}`);
  } finally {
    if (page) {
      await page.close();
    }
  }
};

// Fonction principale de scraping
const scrapeWebpage = async (url, method = 'auto') => {
  try {
    const normalizedUrl = validateAndNormalizeUrl(url);

    let result;

    if (method === 'puppeteer' || (method === 'auto' && browserInstance)) {
      try {
        result = await scrapeWithPuppeteer(normalizedUrl);
      } catch (error) {
        console.log(`⚠️ Puppeteer échoué, fallback vers Cheerio: ${error.message}`);
        result = await scrapeWithCheerio(normalizedUrl);
      }
    } else {
      result = await scrapeWithCheerio(normalizedUrl);
    }

    // Vérifier que du contenu a été extrait
    if (!result.content || result.content.length < 100) {
      throw new Error('Contenu insuffisant extrait de la page');
    }

    return result;

  } catch (error) {
    throw new Error(`Erreur lors du scraping: ${error.message}`);
  }
};

// Fonction pour scraper plusieurs URLs
const scrapeMultipleUrls = async (urls, method = 'auto') => {
  const results = [];
  const errors = [];

  for (const url of urls) {
    try {
      console.log(`🔍 Scraping: ${url}`);
      const result = await scrapeWebpage(url, method);
      results.push(result);

      // Petit délai entre les requêtes pour éviter d'être bloqué
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ Erreur pour ${url}:`, error.message);
      errors.push({ url, error: error.message });
    }
  }

  return { results, errors };
};

// ============= EXISTING FUNCTIONS (unchanged) =============

// Fonction pour parser le texte selon le type de fichier avec streaming
const parseDocumentStream = async (filePath, mimeType, originalName) => {
  try {
    const ext = path.extname(originalName).toLowerCase();

    console.log(`📄 Parsing document: ${originalName} (${ext})`);

    switch (ext) {
      case '.pdf':
        return await parsePDF(filePath);

      case '.txt':
        return await parseTXT(filePath);

      case '.csv':
        return await parseCSV(filePath);

      case '.docx':
        return await parseDOCX(filePath);

      case '.doc':
        return await parseDOC(filePath);

      case '.xlsx':
      case '.xls':
        return await parseExcel(filePath);

      case '.ppt':
      case '.pptx':
        return await parsePowerPoint(filePath);

      case '.rtf':
      case '.odt':
        return await parseWithTextract(filePath);

      case '.json':
        return await parseJSON(filePath);

      case '.xml':
        return await parseXML(filePath);

      default:
        throw new Error(`Type de fichier non supporté: ${ext}`);
    }
  } catch (error) {
    throw new Error(`Erreur lors du parsing du document: ${error.message}`);
  }
};

// ============= INDIVIDUAL PARSING FUNCTIONS =============

// PDF Parser (existing)
const parsePDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
};

// Text Parser (existing but enhanced)
const parseTXT = async (filePath) => {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let content = '';
    rl.on('line', (line) => {
      content += line + '\n';
    });

    rl.on('close', () => {
      resolve(content);
    });

    rl.on('error', (error) => {
      reject(error);
    });
  });
};

// CSV Parser
const parseCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const headers = [];
    let isFirstRow = true;

    fs.createReadStream(filePath)
        .pipe(csv({
          skipEmptyLines: true,
          trim: true
        }))
        .on('headers', (headerList) => {
          headers.push(...headerList);
        })
        .on('data', (data) => {
          if (isFirstRow) {
            isFirstRow = false;
            // Store headers info
            results.push(`Headers: ${Object.keys(data).join(', ')}`);
          }

          // Convert each row to readable text
          const rowText = Object.entries(data)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' | ');
          results.push(rowText);
        })
        .on('end', () => {
          const content = results.join('\n');
          resolve(content);
        })
        .on('error', (error) => {
          reject(error);
        });
  });
};

// DOCX Parser
const parseDOCX = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });

    if (result.messages && result.messages.length > 0) {
      console.log('⚠️ Mammoth messages:', result.messages);
    }

    return result.value || '';
  } catch (error) {
    throw new Error(`Erreur lors du parsing DOCX: ${error.message}`);
  }
};

// DOC Parser (using textract)
const parseDOC = async (filePath) => {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (error, text) => {
      if (error) {
        reject(new Error(`Erreur lors du parsing DOC: ${error.message}`));
      } else {
        resolve(text || '');
      }
    });
  });
};

// Excel Parser
const parseExcel = async (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const results = [];

    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      results.push(`=== Sheet: ${sheetName} ===`);

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Use array of arrays format
        defval: '' // Default value for empty cells
      });

      // Convert to readable text
      jsonData.forEach((row, index) => {
        if (row.length > 0) {
          const rowText = row.join(' | ');
          results.push(`Row ${index + 1}: ${rowText}`);
        }
      });

      results.push(''); // Add empty line between sheets
    });

    return results.join('\n');
  } catch (error) {
    throw new Error(`Erreur lors du parsing Excel: ${error.message}`);
  }
};

// PowerPoint Parser
const parsePowerPoint = async (filePath) => {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (error, text) => {
      if (error) {
        reject(new Error(`Erreur lors du parsing PowerPoint: ${error.message}`));
      } else {
        resolve(text || '');
      }
    });
  });
};

// Generic textract parser for RTF, ODT, etc.
const parseWithTextract = async (filePath) => {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, { preserveLineBreaks: true }, (error, text) => {
      if (error) {
        reject(new Error(`Erreur lors du parsing avec textract: ${error.message}`));
      } else {
        resolve(text || '');
      }
    });
  });
};

// JSON Parser
const parseJSON = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(content);

    // Convert JSON to readable text
    const flattenObject = (obj, prefix = '') => {
      let result = [];
      for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          result = result.concat(flattenObject(obj[key], newKey));
        } else {
          result.push(`${newKey}: ${JSON.stringify(obj[key])}`);
        }
      }
      return result;
    };

    const flattened = flattenObject(jsonData);
    return flattened.join('\n');
  } catch (error) {
    throw new Error(`Erreur lors du parsing JSON: ${error.message}`);
  }
};

// XML Parser
const parseXML = async (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Simple XML to text conversion (removes tags, keeps content)
    return content
        .replace(/<[^>]*>/g, ' ')  // Remove XML tags
        .replace(/\s+/g, ' ')      // Normalize whitespace
        .trim();
  } catch (error) {
    throw new Error(`Erreur lors du parsing XML: ${error.message}`);
  }
};

// Fonction optimisée pour découper le texte en chunks plus petits
const splitTextIntoChunks = (text, chunkSize = 800, overlap = 100) => {
  const chunks = [];
  let start = 0;

  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > chunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      const sentences = paragraph.split(/[.!?]+/);
      for (const sentence of sentences) {
        if (sentence.trim()) {
          if (currentChunk.length + sentence.length > chunkSize) {
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence.trim() + '. ';
          } else {
            currentChunk += sentence.trim() + '. ';
          }
        }
      }
    } else {
      if (currentChunk.length + paragraph.length > chunkSize) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = paragraph + '\n\n';
      } else {
        currentChunk += paragraph + '\n\n';
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 50);
};

// Fonction pour générer des embeddings avec gestion des erreurs et retry
const generateEmbedding = async (text, retries = 3) => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const truncatedText = cleanText.length > 8000 ? cleanText.substring(0, 8000) : cleanText;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(
          'https://api.openai.com/v1/embeddings',
          {
            model: 'text-embedding-3-small',
            input: truncatedText
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      console.error(`❌ Tentative ${attempt}/${retries} échouée pour l'embedding:`, error.message);

      if (attempt === retries) {
        throw new Error(`Erreur lors de la génération d'embedding après ${retries} tentatives: ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// Fonction pour traiter les chunks par batch
const processBatch = async (chunks, documentId, originalname, mimetype, batchSize = 5) => {
  const vectors = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`📦 Traitement du batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);

    const batchPromises = batch.map(async (chunk, batchIndex) => {
      const chunkIndex = i + batchIndex;
      const chunkId = `${documentId}-chunk-${chunkIndex}`;

      try {
        const embedding = await generateEmbedding(chunk);

        return {
          id: chunkId,
          values: embedding,
          metadata: {
            document_id: documentId,
            chunk_index: chunkIndex,
            text: chunk,
            filename: originalname,
            mime_type: mimetype,
            text_length: chunk.length
          }
        };
      } catch (error) {
        console.error(`❌ Erreur pour le chunk ${chunkIndex}:`, error.message);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    vectors.push(...batchResults.filter(result => result !== null));

    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return vectors;
};

// Fonction pour indexer dans Pinecone par batch
const indexInPineconeBatch = async (vectors, batchSize = 100) => {
  const results = [];

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    console.log(`📊 Indexation du batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);

    try {
      const response = await pineconeIndex.upsert(batch);
      results.push(response);

      if (i + batchSize < vectors.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'indexation du batch:`, error.message);
      throw error;
    }
  }

  return results;
};

// Fonction pour sauvegarder en base Supabase
const saveToSupabase = async (documentData) => {
  try {
    const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    throw new Error(`Erreur lors de la sauvegarde Supabase: ${error.message}`);
  }
};

// Fonction pour rechercher dans Pinecone
const searchInPinecone = async (queryVector, topK = 5) => {
  try {
    const response = await pineconeIndex.query({
      vector: queryVector,
      topK: topK,
      includeMetadata: true
    });
    return response.matches;
  } catch (error) {
    throw new Error(`Erreur lors de la recherche Pinecone: ${error.message}`);
  }
};

// Fonction pour générer une réponse avec GPT-4
const generateResponse = async (query, context) => {
  try {
    const prompt = `Contexte: ${context}\n\nQuestion: ${query}\n\nRéponds à la question en utilisant uniquement les informations du contexte fourni. Si la réponse n'est pas dans le contexte, dis-le clairement.`;

    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant qui répond aux questions en te basant uniquement sur le contexte fourni.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    throw new Error(`Erreur lors de la génération de réponse: ${error.message}`);
  }
};

// ============= ROUTES =============

// Route de test
app.get('/stat', (req, res) => {
  res.json({
    message: 'Moteur de recherche sémantique RAG avec Web Scraping - API active',
    endpoints: ['/upload', '/scrape', '/scrape-multiple', '/search', '/generate', '/documents'],
    features: ['Document Upload', 'Web Scraping', 'Semantic Search', 'RAG Generation'],
    status: 'OK',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// ============= NEW WEB SCRAPING ROUTES =============

// Route pour scraper une seule page web
app.post('/scrape', async (req, res) => {
  try {
    const { url, method = 'auto', process_immediately = true } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL manquante' });
    }

    console.log(`🌐 Scraping de: ${url}`);

    // 1. Scraper la page
    const scrapedData = await scrapeWebpage(url, method);

    if (!process_immediately) {
      // Retourner seulement les données scrapées
      return res.json({
        success: true,
        data: scrapedData,
        processed: false
      });
    }

    // 2. Traiter et indexer le contenu
    const documentId = uuidv4();
    const chunks = splitTextIntoChunks(scrapedData.content, 800, 100);

    console.log(`📦 Chunks créés: ${chunks.length}`);

    // 3. Sauvegarder en base
    const documentData = {
      id: documentId,
      filename: scrapedData.title,
      file_path: scrapedData.url,
      mime_type: 'text/html',
      content: scrapedData.content.substring(0, 10000),
      chunk_count: chunks.length,
      source_type: 'web_scraping',
      source_method: scrapedData.method,
      created_at: new Date().toISOString()
    };

    const savedDocument = await saveToSupabase(documentData);

    // 4. Traiter les chunks
    const vectors = await processBatch(chunks, documentId, scrapedData.title, 'text/html', 3);

    // 5. Indexer dans Pinecone
    await indexInPineconeBatch(vectors, 50);

    res.json({
      success: true,
      message: 'Page web scrapée et indexée avec succès',
      document_id: documentId,
      url: scrapedData.url,
      title: scrapedData.title,
      method: scrapedData.method,
      chunks_processed: vectors.length,
      chunks_total: chunks.length,
      content_length: scrapedData.content.length
    });

  } catch (error) {
    console.error('❌ Erreur lors du scraping:', error);
    res.status(500).json({
      error: 'Erreur lors du scraping',
      details: error.message
    });
  }
});

// Route pour scraper plusieurs pages web
app.post('/scrape-multiple', async (req, res) => {
  try {
    const { urls, method = 'auto', process_immediately = true } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Liste d\'URLs manquante ou invalide' });
    }

    if (urls.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 URLs par requête' });
    }

    console.log(`🌐 Scraping de ${urls.length} pages...`);

    // 1. Scraper toutes les pages
    const { results, errors } = await scrapeMultipleUrls(urls, method);

    if (!process_immediately) {
      return res.json({
        success: true,
        results,
        errors,
        processed: false
      });
    }

    // 2. Traiter et indexer chaque page
    const processedDocuments = [];

    for (const scrapedData of results) {
      try {
        const documentId = uuidv4();
        const chunks = splitTextIntoChunks(scrapedData.content, 800, 100);

        // Sauvegarder en base
        const documentData = {
          id: documentId,
          filename: scrapedData.title,
          file_path: scrapedData.url,
          mime_type: 'text/html',
          content: scrapedData.content.substring(0, 10000),
          chunk_count: chunks.length,
          source_type: 'web_scraping',
          source_method: scrapedData.method,
          created_at: new Date().toISOString()
        };

        await saveToSupabase(documentData);

        // Traiter les chunks
        const vectors = await processBatch(chunks, documentId, scrapedData.title, 'text/html', 3);

        // Indexer dans Pinecone
        await indexInPineconeBatch(vectors, 50);

        processedDocuments.push({
          document_id: documentId,
          url: scrapedData.url,
          title: scrapedData.title,
          method: scrapedData.method,
          chunks_processed: vectors.length,
          content_length: scrapedData.content.length
        });

      } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${scrapedData.url}:`, error);
        errors.push({ url: scrapedData.url, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `${processedDocuments.length} pages traitées avec succès`,
      processed_documents: processedDocuments,
      errors,
      total_requested: urls.length,
      total_scraped: results.length,
      total_processed: processedDocuments.length
    });

  } catch (error) {
    console.error('❌ Erreur lors du scraping multiple:', error);
    res.status(500).json({
      error: 'Erreur lors du scraping multiple',
      details: error.message
    });
  }
});

// Route pour tester le scraping d'une URL (sans traitement)
app.post('/scrape-test', async (req, res) => {
  try {
    const { url, method = 'auto' } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL manquante' });
    }

    const scrapedData = await scrapeWebpage(url, method);

    res.json({
      success: true,
      data: {
        url: scrapedData.url,
        title: scrapedData.title,
        method: scrapedData.method,
        content_length: scrapedData.content.length,
        content_preview: scrapedData.content.substring(0, 500) + '...'
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du test de scraping:', error);
    res.status(500).json({
      error: 'Erreur lors du test de scraping',
      details: error.message
    });
  }
});

// ============= EXISTING ROUTES (unchanged) =============

// Route d'upload et traitement des documents (optimisée)

app.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { filename, originalname, path: filePath, mimetype } = req.file;
    const documentId = uuidv4();

    console.log(`📄 Traitement du document: ${originalname}`);
    console.log(`📊 Mémoire avant traitement: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);

    // Updated to pass originalname
    const text = await parseDocumentStream(filePath, mimetype, originalname);
    console.log(`📝 Texte extrait: ${text.length} caractères`);

    if (!text || text.trim().length < 10) {
      throw new Error('Aucun contenu textuel extrait du document');
    }

    const chunks = splitTextIntoChunks(text, 800, 100);
    console.log(`📦 Chunks créés: ${chunks.length}`);

    // FIXED: Removed file_extension field that doesn't exist in your database
    const documentData = {
      id: documentId,
      filename: originalname,
      file_path: filePath,
      mime_type: mimetype,
      content: text.substring(0, 10000),
      chunk_count: chunks.length,
      source_type: 'file_upload',
      created_at: new Date().toISOString()
    };

    const savedDocument = await saveToSupabase(documentData);

    console.log(`🔄 Démarrage du traitement par batch...`);
    const vectors = await processBatch(chunks, documentId, originalname, mimetype, 3);
    console.log(`✅ Vecteurs générés: ${vectors.length}/${chunks.length}`);

    console.log(`🔄 Indexation dans Pinecone...`);
    await indexInPineconeBatch(vectors, 50);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    console.log(`📊 Mémoire après traitement: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);

    res.json({
      success: true,
      message: 'Document traité avec succès',
      document_id: documentId,
      filename: originalname,
      file_type: path.extname(originalname).toLowerCase(), // Still return file type in response
      chunks_processed: vectors.length,
      chunks_total: chunks.length,
      content_length: text.length,
      memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB'
    });

  } catch (error) {
    console.error('❌ Erreur lors du traitement:', error);

    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Erreur lors du traitement du document',
      details: error.message
    });
  }
});

app.get('/supported-formats', (req, res) => {
  res.json({
    success: true,
    supported_formats: {
      documents: ['.pdf', '.txt', '.docx', '.doc', '.rtf', '.odt'],
      spreadsheets: ['.csv', '.xlsx', '.xls'],
      presentations: ['.ppt', '.pptx'],
      data: ['.json', '.xml']
    },
    max_file_size: '100MB',
    note: 'Tous les fichiers sont convertis en texte pour l\'indexation sémantique'
  });
});
// Route de recherche sémantique
app.post('/search', async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Requête manquante' });
    }

    console.log(`🔍 Recherche pour: "${query}"`);

    const queryEmbedding = await generateEmbedding(query);
    const matches = await searchInPinecone(queryEmbedding, limit);

    const results = matches.map(match => ({
      id: match.id,
      score: match.score,
      text: match.metadata.text,
      filename: match.metadata.filename,
      document_id: match.metadata.document_id,
      chunk_index: match.metadata.chunk_index,
      source_type: match.metadata.source_type || 'unknown'
    }));

    res.json({
      success: true,
      query,
      results,
      total_results: results.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error);
    res.status(500).json({
      error: 'Erreur lors de la recherche',
      details: error.message
    });
  }
});

// Route de génération RAG
app.post('/generate', async (req, res) => {
  try {
    const { query, limit = 3 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Requête manquante' });
    }

    console.log(`🤖 Génération RAG pour: "${query}"`);

    const queryEmbedding = await generateEmbedding(query);
    const matches = await searchInPinecone(queryEmbedding, limit);

    const context = matches
        .map(match => match.metadata.text)
        .join('\n\n---\n\n');

    const response = await generateResponse(query, context);

    const sources = matches.map(match => ({
      filename: match.metadata.filename,
      score: match.score,
      source_type: match.metadata.source_type || 'unknown',
      text_preview: match.metadata.text.substring(0, 150) + '...'
    }));

    res.json({
      success: true,
      query,
      response,
      sources,
      context_used: context.length > 0
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération',
      details: error.message
    });
  }
});

// Route pour lister les documents
app.get('/documents', async (req, res) => {
  try {
    const { data, error } = await supabase
        .from('documents')
        .select('id, filename, created_at, chunk_count, source_type, source_method')
        .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      documents: data
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des documents:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des documents',
      details: error.message
    });
  }
});

// Route pour supprimer un document
app.delete('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression',
      details: error.message
    });
  }
});

// Route pour obtenir les statistiques mémoire
app.get('/memory', (req, res) => {
  const usage = process.memoryUsage();
  res.json({
    memory: {
      rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(usage.external / 1024 / 1024) + ' MB'
    },
    browser_status: browserInstance ? 'active' : 'inactive'
  });
});

// Route pour obtenir les statistiques du scraping
app.get('/scraping-stats', async (req, res) => {
  try {
    const { data, error } = await supabase
        .from('documents')
        .select('source_type, source_method, created_at')
        .eq('source_type', 'web_scraping');

    if (error) throw error;

    const stats = {
      total_scraped: data.length,
      by_method: {},
      recent_scrapes: data.slice(0, 10)
    };

    data.forEach(doc => {
      const method = doc.source_method || 'unknown';
      stats.by_method[method] = (stats.by_method[method] || 0) + 1;
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stats:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    });
  }
});

// Middleware de gestion des erreurs
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux (max 100MB)' });
    }
  }

  res.status(500).json({
    error: 'Erreur interne du serveur',
    details: error.message
  });
});

/////////////////////////////////////////////////////////////////////// Configuration for clustering/////////////////////////
const CLUSTERING_CONFIG = {
  MIN_DOCUMENTS_FOR_CLUSTERING: 3,
  MAX_CLUSTERS: 10,
  SIMILARITY_THRESHOLD: 0.7,
  RECLUSTERING_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in ms
  CLUSTER_NAMES: [
    'Technical Documentation',
    'Legal Documents',
    'Marketing Content',
    'Financial Reports',
    'Research Papers',
    'Product Information',
    'User Manuals',
    'News Articles',
    'Educational Content',
    'General Knowledge'
  ]
};

// Generate document-level embedding by averaging chunk embeddings
const generateDocumentEmbedding = async (documentId) => {
  try {
    // Query Pinecone to get all chunks for this document
    const response = await pineconeIndex.query({
      // Use a dummy vector of zeros to query all vectors (Pinecone requires a vector for similarity search)
      vector: new Array(1536).fill(0), // Adjust dimension to match your embedding model (e.g., text-embedding-3-small)
      filter: { document_id: documentId },
      topK: 1000, // Ensure this is large enough to get all chunks
      includeValues: true,
      includeMetadata: true
    });

    if (!response.matches || response.matches.length === 0) {
      console.warn(`No chunks found for document ${documentId}`);
      return null; // Handle case where no chunks exist
    }

    // Average the embeddings
    const dimensions = response.matches[0].values.length;
    const avgEmbedding = new Array(dimensions).fill(0);

    response.matches.forEach(match => {
      match.values.forEach((value, index) => {
        avgEmbedding[index] += value;
      });
    });

    // Normalize by number of chunks
    const numChunks = response.matches.length;
    avgEmbedding.forEach((value, index) => {
      avgEmbedding[index] = value / numChunks;
    });

    return avgEmbedding;
  } catch (error) {
    throw new Error(`Error generating document embedding for ID ${documentId}: ${error.message}`);
  }
};

// Calculate similarity between two documents
const calculateDocumentSimilarity = (embedding1, embedding2) => {
  try {
    return cosineSimilarity(embedding1, embedding2);
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0;
  }
};

// K-means clustering implementation
const performKMeansClustering = (embeddings, numClusters) => {
  try {
    const data = embeddings.map(emb => emb.embedding);
    const result = kmeans(data, numClusters, {
      maxIterations: 100,
      tolerance: 1e-4
    });

    return {
      clusters: result.clusters,
      centroids: result.centroids,
      iterations: result.iterations
    };
  } catch (error) {
    throw new Error(`K-means clustering failed: ${error.message}`);
  }
};

// Hierarchical clustering based on similarity
const performHierarchicalClustering = (documents) => {
  const clusters = [];
  const processed = new Set();

  documents.forEach((doc, index) => {
    if (processed.has(index)) return;

    const cluster = {
      id: uuidv4(),
      documents: [doc],
      centroid: doc.embedding,
      avgSimilarity: 0
    };

    // Find similar documents
    documents.forEach((otherDoc, otherIndex) => {
      if (index === otherIndex || processed.has(otherIndex)) return;

      const similarity = calculateDocumentSimilarity(doc.embedding, otherDoc.embedding);

      if (similarity > CLUSTERING_CONFIG.SIMILARITY_THRESHOLD) {
        cluster.documents.push(otherDoc);
        processed.add(otherIndex);
      }
    });

    // Calculate average centroid if multiple documents
    if (cluster.documents.length > 1) {
      const dimensions = cluster.centroid.length;
      const newCentroid = new Array(dimensions).fill(0);

      cluster.documents.forEach(clusterDoc => {
        clusterDoc.embedding.forEach((value, dim) => {
          newCentroid[dim] += value;
        });
      });

      newCentroid.forEach((value, dim) => {
        newCentroid[dim] = value / cluster.documents.length;
      });

      cluster.centroid = newCentroid;
    }

    clusters.push(cluster);
    processed.add(index);
  });

  return clusters;
};

// Generate cluster name using GPT
const generateClusterName = async (sampleTexts) => {
  try {
    const combinedText = sampleTexts.slice(0, 3).join('\n\n---\n\n');
    const prompt = `Based on the following document excerpts, suggest a concise, descriptive name (2-4 words) for this document cluster:

${combinedText}

Cluster name:`;

    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Generate concise, professional cluster names for document collections. Keep names between 2-4 words and focus on the main topic or domain.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 50,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating cluster name:', error);
    return 'Document Cluster';
  }
};

// Main clustering function
const clusterDocuments = async (method = 'hierarchical') => {
  try {
    console.log('🔄 Starting document clustering...');

    // Get all documents from database
    const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    if (documents.length < CLUSTERING_CONFIG.MIN_DOCUMENTS_FOR_CLUSTERING) {
      console.log(`⚠️ Not enough documents for clustering (${documents.length} < ${CLUSTERING_CONFIG.MIN_DOCUMENTS_FOR_CLUSTERING})`);
      return { success: false, message: 'Not enough documents for clustering' };
    }

    console.log(`📊 Processing ${documents.length} documents...`);

    // Generate document embeddings
    const documentsWithEmbeddings = [];
    for (const doc of documents) {
      try {
        console.log(`🔍 Generating embedding for: ${doc.filename}`);
        const embedding = await generateDocumentEmbedding(doc.id);
        documentsWithEmbeddings.push({
          ...doc,
          embedding
        });

        // Save document embedding to database
        await supabase
            .from('documents')
            .update({ document_embedding: JSON.stringify(embedding) })
            .eq('id', doc.id);

      } catch (error) {
        console.error(`❌ Failed to generate embedding for ${doc.filename}:`, error);
      }
    }

    console.log(`✅ Generated embeddings for ${documentsWithEmbeddings.length} documents`);

    let clusters;

    if (method === 'kmeans') {
      // Determine optimal number of clusters (simple heuristic)
      const numClusters = Math.min(
          Math.max(2, Math.floor(Math.sqrt(documentsWithEmbeddings.length))),
          CLUSTERING_CONFIG.MAX_CLUSTERS
      );

      const clusterResult = performKMeansClustering(documentsWithEmbeddings, numClusters);

      // Convert k-means results to our cluster format
      clusters = [];
      for (let i = 0; i < numClusters; i++) {
        const clusterDocs = documentsWithEmbeddings.filter((_, index) => clusterResult.clusters[index] === i);
        if (clusterDocs.length > 0) {
          clusters.push({
            id: uuidv4(),
            documents: clusterDocs,
            centroid: clusterResult.centroids[i],
            method: 'kmeans'
          });
        }
      }
    } else {
      // Hierarchical clustering
      clusters = performHierarchicalClustering(documentsWithEmbeddings);
    }

    console.log(`📦 Created ${clusters.length} clusters`);

    // Generate names for clusters and save to database
    const clusterSummary = [];
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];

      // Get sample texts for cluster naming
      const sampleTexts = cluster.documents.slice(0, 3).map(doc =>
          doc.content.substring(0, 500)
      );

      const clusterName = await generateClusterName(sampleTexts);
      console.log(`🏷️ Cluster ${i + 1}: "${clusterName}" (${cluster.documents.length} documents)`);

      // Update documents with cluster information
      for (const doc of cluster.documents) {
        await supabase
            .from('documents')
            .update({
              cluster_id: cluster.id,
              cluster_name: clusterName,
              cluster_confidence: 0.8 // You can implement more sophisticated confidence scoring
            })
            .eq('id', doc.id);
      }

      clusterSummary.push({
        id: cluster.id,
        name: clusterName,
        document_count: cluster.documents.length,
        documents: cluster.documents.map(doc => ({
          id: doc.id,
          filename: doc.filename,
          source_type: doc.source_type
        }))
      });
    }

    // Save clustering metadata
    await supabase
        .from('clustering_runs')
        .insert({
          id: uuidv4(),
          method: method,
          total_documents: documents.length,
          total_clusters: clusters.length,
          created_at: new Date().toISOString(),
          config: JSON.stringify(CLUSTERING_CONFIG)
        });

    return {
      success: true,
      method,
      total_documents: documents.length,
      clusters_created: clusters.length,
      clusters: clusterSummary
    };

  } catch (error) {
    console.error('❌ Error during clustering:', error);
    throw error;
  }
};

// Find similar documents to a given document
const findSimilarDocuments = async (documentId, limit = 5) => {
  try {
    // Get the document and its embedding
    const { data: doc, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

    if (error) throw error;

    let docEmbedding;
    if (doc.document_embedding) {
      docEmbedding = JSON.parse(doc.document_embedding);
    } else {
      docEmbedding = await generateDocumentEmbedding(documentId);
    }

    // Get all other documents with embeddings
    const { data: allDocs } = await supabase
        .from('documents')
        .select('*')
        .neq('id', documentId)
        .not('document_embedding', 'is', null);

    const similarities = allDocs.map(otherDoc => {
      const otherEmbedding = JSON.parse(otherDoc.document_embedding);
      const similarity = calculateDocumentSimilarity(docEmbedding, otherEmbedding);

      return {
        ...otherDoc,
        similarity
      };
    });

    // Sort by similarity and return top results
    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

  } catch (error) {
    throw new Error(`Error finding similar documents: ${error.message}`);
  }
};

// ============= CLUSTERING ROUTES =============

// Route to trigger clustering
app.post('/cluster-documents', async (req, res) => {
  try {
    const { method = 'hierarchical', force = false } = req.body;

    // Check if recent clustering exists (unless forced)
    if (!force) {
      const { data: recentRun } = await supabase
          .from('clustering_runs')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

      if (recentRun) {
        const timeSinceLastRun = Date.now() - new Date(recentRun.created_at).getTime();
        if (timeSinceLastRun < CLUSTERING_CONFIG.RECLUSTERING_INTERVAL) {
          return res.json({
            success: false,
            message: 'Recent clustering exists. Use force=true to override.',
            last_run: recentRun.created_at
          });
        }
      }
    }

    const result = await clusterDocuments(method);
    res.json(result);

  } catch (error) {
    console.error('❌ Error in clustering route:', error);
    res.status(500).json({
      error: 'Error during document clustering',
      details: error.message
    });
  }
});

// Route to get clusters
// Route to get clusters
app.get('/clusters', async (req, res) => {
  try {
    const { data: documents, error } = await supabase
        .from('documents')
        .select('cluster_id, cluster_name')
        .not('cluster_id', 'is', null);

    if (error) throw error;

    // Group documents by cluster_id + cluster_name
    const clusterMap = {};
    documents.forEach((doc) => {
      const key = doc.cluster_id;
      if (!clusterMap[key]) {
        clusterMap[key] = {
          cluster_id: doc.cluster_id,
          cluster_name: doc.cluster_name,
          documents: []
        };
      }
      clusterMap[key].documents.push(doc);
    });

    // Build summary for each cluster
    const clusterSummary = await Promise.all(
        Object.values(clusterMap).map(async (cluster) => {
          const { data: docs } = await supabase
              .from('documents')
              .select('id, filename, source_type, created_at')
              .eq('cluster_id', cluster.cluster_id);

          return {
            id: cluster.cluster_id,
            name: cluster.cluster_name,
            document_count: docs.length,
            documents: docs
          };
        })
    );

    res.json({
      success: true,
      clusters: clusterSummary
    });

  } catch (error) {
    console.error('❌ Error getting clusters:', error);
    res.status(500).json({
      error: 'Error retrieving clusters',
      details: error.message
    });
  }
});


// Route to get documents in a specific cluster
app.get('/clusters/:clusterId/documents', async (req, res) => {
  try {
    const { clusterId } = req.params;

    const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('cluster_id', clusterId);

    if (error) throw error;

    res.json({
      success: true,
      cluster_id: clusterId,
      documents
    });

  } catch (error) {
    console.error('❌ Error getting cluster documents:', error);
    res.status(500).json({
      error: 'Error retrieving cluster documents',
      details: error.message
    });
  }
});

// Route to find similar documents
app.post('/similar-documents', async (req, res) => {
  try {
    const { document_id, limit = 5 } = req.body;

    if (!document_id) {
      return res.status(400).json({ error: 'document_id is required' });
    }

    const similarDocs = await findSimilarDocuments(document_id, limit);

    res.json({
      success: true,
      document_id,
      similar_documents: similarDocs
    });

  } catch (error) {
    console.error('❌ Error finding similar documents:', error);
    res.status(500).json({
      error: 'Error finding similar documents',
      details: error.message
    });
  }
});

// Enhanced search route with cluster filtering
app.post('/search-clustered', async (req, res) => {
  try {
    const { query, cluster_id, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🔍 Clustered search for: "${query}"${cluster_id ? ` in cluster: ${cluster_id}` : ''}`);

    const queryEmbedding = await generateEmbedding(query);

    // Build filter for Pinecone
    let filter = {};
    if (cluster_id) {
      // Get documents in the cluster
      const { data: clusterDocs, error } = await supabase
          .from('documents')
          .select('id')
          .eq('cluster_id', cluster_id);

      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
      }

      if (!clusterDocs || clusterDocs.length === 0) {
        console.log(`⚠️ No documents found for cluster_id: ${cluster_id}`);
        return res.json({
          success: true,
          query,
          cluster_filter: cluster_id,
          results: [],
          total_results: 0,
          message: 'No documents found in the specified cluster'
        });
      }

      const documentIds = clusterDocs.map(doc => doc.id);
      filter.document_id = { $in: documentIds };
    }

    // Execute Pinecone query
    const response = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined
    });

    // Validate response structure
    if (!response || !Array.isArray(response.matches)) {
      console.error('Invalid Pinecone response:', response);
      throw new Error('Invalid response from Pinecone: matches is not an array');
    }

    const matches = response.matches;

    // Log matches for debugging
    console.log(`Found ${matches.length} matches`);

    const results = await Promise.all(
        matches.map(async (match) => {
          // Get document info including cluster
          const { data: doc, error: docError } = await supabase
              .from('documents')
              .select('cluster_id, cluster_name')
              .eq('id', match.metadata.document_id)
              .single();

          if (docError) {
            console.warn(`Failed to fetch document ${match.metadata.document_id}: ${docError.message}`);
          }

          return {
            id: match.id,
            score: match.score,
            text: match.metadata.text,
            filename: match.metadata.filename,
            document_id: match.metadata.document_id,
            chunk_index: match.metadata.chunk_index,
            source_type: match.metadata.source_type || 'unknown',
            cluster_id: doc?.cluster_id || null,
            cluster_name: doc?.cluster_name || null
          };
        })
    );

    res.json({
      success: true,
      query,
      cluster_filter: cluster_id,
      results,
      total_results: results.length
    });

  } catch (error) {
    console.error('❌ Error in clustered search:', error);
    res.status(500).json({
      error: 'Error in clustered search',
      details: error.message
    });
  }
});

// Add to the existing documents route to include cluster info
app.get('/documents-enhanced', async (req, res) => {
  try {
    const { cluster_id } = req.query;

    let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

    if (cluster_id) {
      query = query.eq('cluster_id', cluster_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by clusters
    const groupedByCluster = data.reduce((acc, doc) => {
      const clusterId = doc.cluster_id || 'unclustered';
      const clusterName = doc.cluster_name || 'Unclustered';

      if (!acc[clusterId]) {
        acc[clusterId] = {
          cluster_id: clusterId,
          cluster_name: clusterName,
          documents: []
        };
      }

      acc[clusterId].documents.push(doc);
      return acc;
    }, {});

    res.json({
      success: true,
      total_documents: data.length,
      clusters: Object.values(groupedByCluster)
    });

  } catch (error) {
    console.error('❌ Error getting enhanced documents:', error);
    res.status(500).json({
      error: 'Error retrieving enhanced documents',
      details: error.message
    });
  }
});


///////////////////////////////// ============= AUTO-RESEARCH SYSTEM =============////////////////////////////////////////////////
//
// ============= AUTO-RESEARCH SYSTEM - FIXED VERSION =============
// Add these functions after your existing web scraping functions



// Query Analysis Function
const analyzeUserQuery = async (userQuery) => {
  try {
    const prompt = `
Analyze this user query and extract information for intelligent web research:

1. Main topics/keywords (2-4 key terms)
2. Query intent (factual, how-to, news, comparison, opinion, technical)
3. Suggested search terms (3-5 variations optimized for search engines)
4. Content freshness needed (recent, evergreen, mixed)
5. Preferred source types (news, academic, documentation, forums, official, blogs)

User Query: "${userQuery}"

Respond in valid JSON format only:
{
  "main_topics": ["topic1", "topic2"],
  "intent": "factual",
  "search_terms": ["search term 1", "search term 2", "search term 3"],
  "freshness_needed": "recent",
  "preferred_sources": ["news", "documentation"]
}`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'You are a research assistant. Always respond with valid JSON only.'
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.1,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const content = response.data.choices[0].message.content.trim();
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Error analyzing query:', error.message);
    // Fallback analysis
    return {
      main_topics: [userQuery.split(' ').slice(0, 2).join(' ')],
      intent: 'factual',
      search_terms: [userQuery, userQuery + ' guide', userQuery + ' explanation'],
      freshness_needed: 'mixed',
      preferred_sources: ['documentation', 'news']
    };
  }
};

// Search Websites using SerpAPI
const searchWebsites = async (searchTerms, options = {}) => {
  const {
    max_results_per_term = 8,
    country = 'us',
    language = 'en',
    excluded_domains = []
  } = options;

  const allResults = [];

  for (const term of searchTerms) {
    try {
      console.log(`🔍 Searching for: "${term}"`);

      const response = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google',
          q: term,
          api_key: process.env.SERPAPI_KEY,
          num: max_results_per_term,
          hl: language,
          gl: country,
          safe: 'active' // Filter explicit content
        },
        timeout: 15000
      });

      const results = response.data.organic_results || [];

      const processedResults = results
          .filter(result => {
            // Filter out excluded domains
            if (!result.link) return false;
            try {
              const domain = new URL(result.link).hostname.replace('www.', '');
              return !excluded_domains.some(excluded => domain.includes(excluded));
            } catch {
              return false;
            }
          })
          .map(result => ({
            title: result.title || 'No title',
            url: result.link,
            snippet: result.snippet || result.rich_snippet?.top?.detected_extensions || '',
            search_term: term,
            position: result.position || 0,
            displayed_link: result.displayed_link || result.link
          }));

      allResults.push(...processedResults);

      // Rate limiting to avoid hitting SerpAPI limits
      if (searchTerms.indexOf(term) < searchTerms.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Search error for term "${term}":`, error.message);
      // Continue with other search terms even if one fails
    }
  }

  console.log(`📊 Total search results found: ${allResults.length}`);
  return allResults;
};

// Source Quality Scoring System
const calculateSourceScore = (result, queryAnalysis) => {
  let score = 0;

  // Domain authority boost - expand this list based on your needs
  const domainScores = {
    // High authority domains
    'wikipedia.org': 25, 'github.com': 20, 'stackoverflow.com': 22,
    'medium.com': 15, 'dev.to': 15, 'towards.com': 15,
    // News sources
    'reuters.com': 25, 'bbc.com': 24, 'cnn.com': 20, 'npr.org': 22,
    'techcrunch.com': 20, 'wired.com': 18, 'theverge.com': 18,
    // Academic/Technical
    'nature.com': 30, 'arxiv.org': 28, 'acm.org': 25, 'ieee.org': 25,
    'mit.edu': 25, 'stanford.edu': 25, 'harvard.edu': 25,
    // Documentation sites
    'docs.python.org': 25, 'nodejs.org': 25, 'reactjs.org': 25,
    'developer.mozilla.org': 30, 'w3.org': 28,
    // Government/Official
    'gov': 20, 'edu': 18, 'org': 10
  };

  try {
    const domain = new URL(result.url).hostname.replace('www.', '');

    // Check exact domain matches
    if (domainScores[domain]) {
      score += domainScores[domain];
    } else {
      // Check TLD bonuses
      Object.keys(domainScores).forEach(key => {
        if (domain.endsWith(key)) {
          score += domainScores[key];
        }
      });
    }
  } catch (error) {
    // Invalid URL, penalize
    score -= 10;
  }

  // Position in search results (earlier results get higher scores)
  const positionScore = Math.max(0, 15 - (result.position * 1.5));
  score += positionScore;

  // Title relevance scoring
  const titleLower = (result.title || '').toLowerCase();
  const topicMatches = queryAnalysis.main_topics.filter(topic =>
      titleLower.includes(topic.toLowerCase())
  ).length;
  score += topicMatches * 8;

  // Snippet relevance scoring
  const snippetLower = (result.snippet || '').toLowerCase();
  const snippetMatches = queryAnalysis.main_topics.filter(topic =>
      snippetLower.includes(topic.toLowerCase())
  ).length;
  score += snippetMatches * 5;

  // Intent-based scoring
  if (queryAnalysis.intent === 'how-to' &&
      (titleLower.includes('how to') || titleLower.includes('tutorial') || titleLower.includes('guide'))) {
    score += 10;
  }

  if (queryAnalysis.intent === 'news' &&
      (titleLower.includes('2024') || titleLower.includes('2025') || snippetLower.includes('recent'))) {
    score += 15;
  }

  // Penalty for very short snippets (likely low content)
  if ((result.snippet || '').length < 50) {
    score -= 5;
  }

  return Math.max(0, score); // Ensure non-negative scores
};

// Intelligent Source Selection
const selectBestSources = (searchResults, queryAnalysis, maxSources, userPreferences = {}) => {
  const { preferred_domains = [], excluded_domains = [] } = userPreferences;

  // Remove duplicates by URL
  const uniqueResults = searchResults.filter((result, index, self) =>
      index === self.findIndex(r => r.url === result.url)
  );

  console.log(`📋 Filtering ${uniqueResults.length} unique results`);

  // Filter based on user preferences
  let filteredResults = uniqueResults.filter(result => {
    try {
      const domain = new URL(result.url).hostname.replace('www.', '');

      // Check excluded domains
      if (excluded_domains.some(excluded => domain.includes(excluded))) {
        return false;
      }

      return true;
    } catch {
      return false; // Invalid URLs
    }
  });

  // Score and rank sources
  const scoredResults = filteredResults.map(result => ({
    ...result,
    score: calculateSourceScore(result, queryAnalysis)
  }));

  // Apply preferred domain boost
  if (preferred_domains.length > 0) {
    scoredResults.forEach(result => {
      try {
        const domain = new URL(result.url).hostname.replace('www.', '');
        if (preferred_domains.some(preferred => domain.includes(preferred))) {
          result.score += 20; // Boost preferred domains
        }
      } catch {
        // Invalid URL, ignore
      }
    });
  }

  // Sort by score and take top results
  const selectedSources = scoredResults
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSources);

  console.log(`✅ Selected ${selectedSources.length} sources for scraping:`);
  selectedSources.forEach((source, i) => {
    console.log(`   ${i + 1}. ${source.title} (Score: ${source.score}) - ${source.url}`);
  });

  return selectedSources.map(({ score, ...rest }) => ({ ...rest, quality_score: score }));
};

// Enhanced content processing and storage
const processResearchContent = async (selectedSources, originalQuery) => {
  const results = [];
  const errors = [];

  for (const [index, source] of selectedSources.entries()) {
    try {
      console.log(`🔄 Processing source ${index + 1}/${selectedSources.length}: ${source.url}`);

      // Use existing scraping function (make sure this function exists in your codebase)
      const scrapedData = await scrapeWebpage(source.url, 'auto');

      // Validate content quality
      if (!scrapedData.content || scrapedData.content.length < 200) {
        throw new Error('Insufficient content extracted');
      }

      // Create unique document ID
      const documentId = uuidv4();

      // Process content into chunks (make sure this function exists)
      const chunks = splitTextIntoChunks(scrapedData.content, 800, 100);

      if (chunks.length === 0) {
        throw new Error('No valid chunks created from content');
      }

      // Enhanced document metadata for research
      const documentData = {
        id: documentId,
        filename: scrapedData.title,
        file_path: scrapedData.url,
        mime_type: 'text/html',
        content: scrapedData.content.substring(0, 10000), // Store preview
        chunk_count: chunks.length,
        source_type: 'auto_research',
        source_method: scrapedData.method,
        research_query: originalQuery,
        search_term: source.search_term,
        quality_score: source.quality_score,
        domain: new URL(source.url).hostname.replace('www.', ''),
        original_snippet: source.snippet,
        created_at: new Date().toISOString()
      };

      // Save to Supabase (make sure this function exists)
      await saveToSupabase(documentData);

      // Create embeddings and store in Pinecone (make sure these functions exist)
      const vectors = await processBatch(chunks, documentId, scrapedData.title, 'text/html', 3);

      if (vectors.length > 0) {
        await indexInPineconeBatch(vectors, 50);
      }

      results.push({
        document_id: documentId,
        url: source.url,
        title: scrapedData.title,
        domain: documentData.domain,
        content_length: scrapedData.content.length,
        chunks_created: chunks.length,
        chunks_indexed: vectors.length,
        search_term: source.search_term,
        quality_score: source.quality_score,
        processing_method: scrapedData.method,
        original_snippet: source.snippet.substring(0, 200) + '...'
      });

      console.log(`✅ Successfully processed: ${scrapedData.title}`);

      // Rate limiting between scrapes
      if (index < selectedSources.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`❌ Error processing ${source.url}:`, error.message);
      errors.push({
        url: source.url,
        title: source.title,
        error: error.message,
        search_term: source.search_term
      });
    }
  }

  return { results, errors };
};

// Enhanced RAG response generation with source attribution
const generateResearchResponse = async (query, researchResults, options = {}) => {
  const {
    include_sources = true,
    max_context_length = 4000,
    response_style = 'comprehensive' // comprehensive, concise, bullet-points
  } = options;

  try {
    // Get fresh context from recently indexed content (make sure these functions exist)
    const queryEmbedding = await generateEmbedding(query);
    const matches = await searchInPinecone(queryEmbedding, 8); // Get more matches for better context

    // Filter to only include content from the current research session
    const researchDocIds = researchResults.map(r => r.document_id);
    const relevantMatches = matches.filter(match =>
        researchDocIds.includes(match.metadata.document_id)
    );

    if (relevantMatches.length === 0) {
      throw new Error('No relevant content found from research results');
    }

    // Build context with source attribution
    let context = '';
    const sourceMap = {};

    relevantMatches.forEach((match, index) => {
      const sourceInfo = researchResults.find(r => r.document_id === match.metadata.document_id);
      if (sourceInfo && context.length < max_context_length) {
        const sourceKey = `[Source ${index + 1}]`;
        sourceMap[sourceKey] = {
          title: sourceInfo.title,
          url: sourceInfo.url,
          domain: sourceInfo.domain,
          relevance_score: match.score
        };

        context += `${sourceKey}: ${match.metadata.text}\n\n`;
      }
    });

    // Generate response with GPT-4
    const styleInstructions = {
      comprehensive: 'Provide a detailed, comprehensive answer',
      concise: 'Provide a concise, to-the-point answer',
      'bullet-points': 'Structure your answer using clear bullet points'
    };

    const prompt = `Based on the following research context, answer the user's question. ${styleInstructions[response_style] || styleInstructions.comprehensive}.

Context from recent research:
${context}

Question: ${query}

Instructions:
- Use ONLY the information provided in the context above
- If referencing information, mention the source (e.g., "According to Source 1...")
- If the context doesn't contain enough information to fully answer the question, acknowledge this
- Provide accurate, well-structured information
- Be objective and factual

Answer:`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant providing accurate answers based on provided context. Always cite your sources when making claims.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const generatedResponse = response.data.choices[0].message.content;

    return {
      response: generatedResponse,
      sources_used: include_sources ? Object.entries(sourceMap).map(([key, info]) => ({
        reference: key,
        title: info.title,
        url: info.url,
        domain: info.domain,
        relevance_score: info.relevance_score
      })) : [],
      context_length: context.length,
      sources_available: relevantMatches.length
    };

  } catch (error) {
    throw new Error(`Error generating research response: ${error.message}`);
  }
};

// ============= RESEARCH ROUTES - FIXED =============

// Main auto-research route
app.post('/research', async (req, res) => {
  try {
    const {
      query,
      max_sources = 3,
      search_params = {},
      user_preferences = {},
      response_options = {}
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    if (max_sources > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 sources allowed per research request'
      });
    }

    console.log(`🔬 Starting auto-research for: "${query}"`);
    const startTime = Date.now();

    // Step 1: Analyze the user query
    console.log('📋 Step 1: Analyzing user query...');
    const queryAnalysis = await analyzeUserQuery(query);
    console.log('✅ Query analysis completed:', queryAnalysis);

    // Step 2: Search for relevant websites
    console.log('🌐 Step 2: Searching for relevant websites...');
    const searchOptions = {
      max_results_per_term: search_params.results_per_term || 8,
      country: search_params.country || 'us',
      language: search_params.language || 'en',
      excluded_domains: user_preferences.excluded_domains || []
    };

    const searchResults = await searchWebsites(queryAnalysis.search_terms, searchOptions);

    if (searchResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No search results found for the given query',
        query_analysis: queryAnalysis
      });
    }

    // Step 3: Select best sources
    console.log('🎯 Step 3: Selecting best sources...');
    const selectedSources = selectBestSources(searchResults, queryAnalysis, max_sources, user_preferences);

    if (selectedSources.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No suitable sources found after filtering',
        total_search_results: searchResults.length,
        query_analysis: queryAnalysis
      });
    }

    // Step 4: Scrape and process content
    console.log('🔄 Step 4: Scraping and processing content...');
    const { results: processedContent, errors: processingErrors } = await processResearchContent(selectedSources, query);

    if (processedContent.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process any sources successfully',
        errors: processingErrors,
        selected_sources: selectedSources.map(s => ({ title: s.title, url: s.url }))
      });
    }

    // Step 5: Generate research response
    console.log('🤖 Step 5: Generating research response...');
    const researchResponse = await generateResearchResponse(query, processedContent, response_options);

    const totalTime = Date.now() - startTime;

    // Step 6: Return comprehensive results
    res.json({
      success: true,
      query,
      response: researchResponse.response,
      research_summary: {
        total_sources_processed: processedContent.length,
        total_sources_found: searchResults.length,
        total_chunks_created: processedContent.reduce((sum, r) => sum + r.chunks_created, 0),
        processing_time_seconds: Math.round(totalTime / 1000),
        query_analysis: queryAnalysis
      },
      sources: researchResponse.sources_used,
      processed_content: processedContent,
      processing_errors: processingErrors.length > 0 ? processingErrors : undefined,
      context_info: {
        context_length: researchResponse.context_length,
        sources_available: researchResponse.sources_available
      },
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Research completed in ${Math.round(totalTime / 1000)}s`);

  } catch (error) {
    console.error('❌ Auto-research error:', error);
    res.status(500).json({
      success: false,
      error: 'Auto-research failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Quick research route - FIXED VERSION
app.post('/research/quick', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    console.log(`⚡ Quick research for: "${query}"`);
    const startTime = Date.now();

    // Step 1: Analyze the user query (simplified)
    console.log('📋 Step 1: Analyzing user query...');
    const queryAnalysis = await analyzeUserQuery(query);
    console.log('✅ Query analysis completed:', queryAnalysis);

    // Step 2: Search for relevant websites (fewer results for speed)
    console.log('🌐 Step 2: Searching for relevant websites...');
    const searchOptions = {
      max_results_per_term: 5, // Reduced from default 8
      country: 'us',
      language: 'en',
      excluded_domains: []
    };

    // Only use first 2 search terms for speed
    const searchResults = await searchWebsites(queryAnalysis.search_terms.slice(0, 2), searchOptions);

    if (searchResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No search results found for the given query',
        query_analysis: queryAnalysis
      });
    }

    // Step 3: Select best sources (only 2 for quick research)
    console.log('🎯 Step 3: Selecting best sources...');
    const selectedSources = selectBestSources(searchResults, queryAnalysis, 2, {});

    if (selectedSources.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No suitable sources found after filtering',
        total_search_results: searchResults.length,
        query_analysis: queryAnalysis
      });
    }

    // Step 4: Scrape and process content
    console.log('🔄 Step 4: Scraping and processing content...');
    const { results: processedContent, errors: processingErrors } = await processResearchContent(selectedSources, query);

    if (processedContent.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process any sources successfully',
        errors: processingErrors,
        selected_sources: selectedSources.map(s => ({ title: s.title, url: s.url }))
      });
    }

    // Step 5: Generate research response (concise style)
    console.log('🤖 Step 5: Generating research response...');
    const researchResponse = await generateResearchResponse(query, processedContent, {
      response_style: 'concise',
      max_context_length: 2000 // Reduced context for speed
    });

    const totalTime = Date.now() - startTime;

    // Step 6: Return results
    res.json({
      success: true,
      query,
      response: researchResponse.response,
      research_summary: {
        total_sources_processed: processedContent.length,
        total_sources_found: searchResults.length,
        total_chunks_created: processedContent.reduce((sum, r) => sum + r.chunks_created, 0),
        processing_time_seconds: Math.round(totalTime / 1000),
        query_analysis: queryAnalysis,
        research_type: 'quick'
      },
      sources: researchResponse.sources_used,
      processed_content: processedContent,
      processing_errors: processingErrors.length > 0 ? processingErrors : undefined,
      context_info: {
        context_length: researchResponse.context_length,
        sources_available: researchResponse.sources_available
      },
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Quick research completed in ${Math.round(totalTime / 1000)}s`);

  } catch (error) {
    console.error('❌ Quick research error:', error);
    res.status(500).json({
      success: false,
      error: 'Quick research failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Research with custom sources route
app.post('/research/custom-sources', async (req, res) => {
  try {
    const { query, custom_urls, process_immediately = true } = req.body;

    if (!query || !custom_urls || !Array.isArray(custom_urls)) {
      return res.status(400).json({
        success: false,
        error: 'Query and custom_urls array are required'
      });
    }

    if (custom_urls.length > 5) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5 custom URLs allowed'
      });
    }

    console.log(`🎯 Custom source research for: "${query}"`);

    // Convert URLs to source format
    const customSources = custom_urls.map((url, index) => ({
      title: `Custom Source ${index + 1}`,
      url: url,
      snippet: 'User-provided source',
      search_term: query,
      position: index + 1,
      quality_score: 50 // Neutral score for user-provided sources
    }));

    // Process the custom sources
    const { results, errors } = await processResearchContent(customSources, query);

    if (results.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process any custom sources',
        errors
      });
    }

    // Generate response from custom sources
    const researchResponse = await generateResearchResponse(query, results);

    res.json({
      success: true,
      query,
      response: researchResponse.response,
      sources: researchResponse.sources_used,
      processed_sources: results,
      processing_errors: errors.length > 0 ? errors : undefined,
      source_type: 'custom'
    });

  } catch (error) {
    console.error('❌ Custom source research error:', error);
    res.status(500).json({
      success: false,
      error: 'Custom source research failed',
      details: error.message
    });
  }
});

// Research status and history route
app.get('/research/history', async (req, res) => {
  try {
    const { limit = 20, source_type } = req.query;

    // Make sure supabase is defined in your application
    let query = supabase
        .from('documents')
        .select('id, filename, research_query, domain, quality_score, created_at, source_type, chunk_count')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

    if (source_type) {
      query = query.eq('source_type', source_type);
    } else {
      query = query.in('source_type', ['auto_research', 'custom_research']);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by research sessions (same research_query and similar timestamps)
    const researchSessions = {};
    data.forEach(doc => {
      const sessionKey = doc.research_query || 'Unknown Query';
      if (!researchSessions[sessionKey]) {
        researchSessions[sessionKey] = {
          query: sessionKey,
          sources: [],
          total_chunks: 0,
          latest_research: doc.created_at
        };
      }

      researchSessions[sessionKey].sources.push({
        id: doc.id,
        title: doc.filename,
        domain: doc.domain,
        quality_score: doc.quality_score,
        chunk_count: doc.chunk_count,
        created_at: doc.created_at
      });

      researchSessions[sessionKey].total_chunks += doc.chunk_count || 0;
    });

    const sessions = Object.values(researchSessions)
        .sort((a, b) => new Date(b.latest_research) - new Date(a.latest_research));

    res.json({
      success: true,
      research_sessions: sessions,
      total_sessions: sessions.length,
      total_documents: data.length
    });

  } catch (error) {
    console.error('❌ Research history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve research history',
      details: error.message
    });
  }
});

// Research configuration and supported domains route
app.get('/research/config', (req, res) => {
  res.json({
    success: true,
    configuration: {
      max_sources: 10,
      max_custom_urls: 5,
      supported_search_engines: ['google'],
      supported_countries: ['us', 'uk', 'ca', 'au', 'de', 'fr'],
      supported_languages: ['en', 'fr', 'de', 'es', 'it'],
      response_styles: ['comprehensive', 'concise', 'bullet-points']
    },
    recommended_domains: {
      news: ['bbc.com', 'reuters.com', 'npr.org', 'cnn.com'],
      technical: ['stackoverflow.com', 'github.com', 'developer.mozilla.org'],
      academic: ['arxiv.org', 'nature.com', 'pubmed.ncbi.nlm.nih.gov'],
      documentation: ['docs.python.org', 'nodejs.org', 'reactjs.org']
    },
    example_requests: {
      basic: {
        query: "What are the latest developments in artificial intelligence?",
        max_sources: 3
      },
      with_preferences: {
        query: "How to deploy a Node.js application?",
        max_sources: 4,
        user_preferences: {
          preferred_domains: ["github.com", "nodejs.org"],
          excluded_domains: ["spam-site.com"]
        },
        response_options: {
          response_style: "bullet-points"
        }
      }
    }
  });
});
// ============= CONVERSATION SYSTEM =============

// In-memory storage for conversations (replace with Redis/Database for production)
const conversations = new Map();
const CONVERSATION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_CONVERSATION_HISTORY = 20; // Maximum messages to keep in memory
const MAX_CONVERSATIONS = 1000; // Maximum concurrent conversations

// Conversation cleanup interval
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, conversation] of conversations.entries()) {
    if (now - conversation.lastActivity > CONVERSATION_TIMEOUT) {
      conversations.delete(sessionId);
      console.log(`🧹 Conversation ${sessionId} expired and cleaned up`);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Function to create a new conversation
// ============= RAG-ONLY CONVERSATION SYSTEM =============
const addMessageToConversation = (sessionId, role, content) => {
  const conversation = getConversation(sessionId);

  const message = {
    role,
    content,
    timestamp: Date.now()
  };

  conversation.messages.push(message);
  conversation.messageCount++;
  conversation.lastActivity = Date.now();

  console.log(`📝 Added ${role} message to conversation ${sessionId} (total: ${conversation.messageCount})`);
  return message;
};
// Enhanced function to generate response with MANDATORY RAG context
const generateRAGOnlyResponse = async (sessionId, userMessage, contextLimit = 5, minRelevanceScore = 0.3) => {
  try {
    const conversation = getConversation(sessionId);

    // Add user message to conversation
    addMessageToConversation(sessionId, 'user', userMessage);

    // ALWAYS search for relevant context - this is mandatory for RAG-only mode
    let context = null;
    let sources = [];
    let hasRelevantContext = false;

    try {
      console.log(`🔍 Searching RAG database for: "${userMessage}"`);
      const queryEmbedding = await generateEmbedding(userMessage);
      const matches = await searchInPinecone(queryEmbedding, contextLimit);

      if (matches && matches.length > 0) {
        // Filter matches by relevance score
        const relevantMatches = matches.filter(match => match.score >= minRelevanceScore);

        if (relevantMatches.length > 0) {
          hasRelevantContext = true;
          context = relevantMatches
              .map(match => `Source: ${match.metadata.filename} (Score: ${match.score.toFixed(3)})\nContent: ${match.metadata.text}`)
              .join('\n\n---\n\n');

          sources = relevantMatches.map(match => ({
            filename: match.metadata.filename,
            score: match.score,
            source_type: match.metadata.source_type || 'unknown',
            document_id: match.metadata.document_id,
            chunk_index: match.metadata.chunk_index,
            text_preview: match.metadata.text.substring(0, 150) + '...'
          }));

          console.log(`✅ Found ${relevantMatches.length} relevant sources`);
        } else {
          console.log(`⚠️ No matches above relevance threshold (${minRelevanceScore})`);
        }
      } else {
        console.log(`⚠️ No matches found in RAG database`);
      }
    } catch (error) {
      console.error('❌ Error searching RAG database:', error.message);
      throw new Error('Unable to search knowledge base: ' + error.message);
    }

    // Prepare messages for OpenAI with strict RAG-only instructions
    let messages = [...conversation.messages];

    if (hasRelevantContext) {
      // Add context as a system message with strict instructions
      const contextMessage = {
        role: 'system',
        content: `IMPORTANT: You are a RAG (Retrieval-Augmented Generation) assistant that can ONLY answer questions based on the provided knowledge base content below. You MUST follow these rules:

1. ONLY use information from the knowledge base provided below
2. If the answer is not in the provided content, explicitly state "I don't have information about this in my knowledge base"
3. Always cite which source(s) you're referencing when providing answers
4. Do not use any general knowledge or information outside of what's provided
5. Be helpful but honest about the limitations of the available information

KNOWLEDGE BASE CONTENT:
${context}

Please answer the user's question using ONLY the information above.`
      };

      // Insert context message before the last user message
      messages.splice(-1, 0, contextMessage);
    } else {
      // No relevant context found - add message to explain this
      const noContextMessage = {
        role: 'system',
        content: `IMPORTANT: No relevant information was found in the knowledge base for the user's question. You MUST respond that you don't have information about this topic in your knowledge base. Do not provide any general knowledge or external information.`
      };

      messages.splice(-1, 0, noContextMessage);
    }

    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: messages,
          max_tokens: 1500,
          temperature: 0.3, // Lower temperature for more factual responses
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
    );

    const assistantMessage = response.data.choices[0].message.content;

    // Add assistant response to conversation
    addMessageToConversation(sessionId, 'assistant', assistantMessage);

    return {
      response: assistantMessage,
      sessionId,
      messageCount: conversation.messageCount,
      hasRelevantContext,
      sources: sources,
      totalSources: sources.length,
      minRelevanceScore,
      usage: response.data.usage
    };

  } catch (error) {
    throw new Error(`Error generating RAG response: ${error.message}`);
  }
};

// Modified function to create RAG-only conversations
const createRAGConversation = (sessionId, systemPrompt = null) => {
  // Clean old conversations if we hit the limit
  if (conversations.size >= MAX_CONVERSATIONS) {
    const oldestSession = [...conversations.entries()]
        .sort(([,a], [,b]) => a.lastActivity - b.lastActivity)[0][0];
    conversations.delete(oldestSession);
    console.log(`🧹 Removed oldest conversation ${oldestSession} due to memory limit`);
  }

  const defaultRAGSystemPrompt = `You are a specialized RAG (Retrieval-Augmented Generation) assistant. Your role is to answer questions EXCLUSIVELY based on the indexed documents and web content in the knowledge base.

STRICT RULES:
1. You can ONLY provide information that exists in the indexed knowledge base
2. You MUST NOT use any general knowledge or external information
3. If information is not available in the knowledge base, you MUST clearly state this
4. Always cite your sources when providing information
5. Be helpful within these constraints, but never fabricate or assume information

Your knowledge base contains documents and web content that users have uploaded or scraped. Only reference this content.`;

  const conversation = {
    sessionId,
    messages: [
      {
        role: 'system',
        content: systemPrompt || defaultRAGSystemPrompt
      }
    ],
    createdAt: Date.now(),
    lastActivity: Date.now(),
    messageCount: 0,
    ragOnly: true // Flag to indicate this is a RAG-only conversation
  };

  conversations.set(sessionId, conversation);
  return conversation;
};

// ============= UPDATED CONVERSATION ROUTES (RAG-ONLY) =============

// Route to start a new RAG-only conversation
app.post('/conversation/start', (req, res) => {
  try {
    const { sessionId, systemPrompt } = req.body;

    const finalSessionId = sessionId || `rag_session_${uuidv4()}`;
    const conversation = createRAGConversation(finalSessionId, systemPrompt);

    res.json({
      success: true,
      message: 'RAG-only conversation started successfully',
      sessionId: finalSessionId,
      createdAt: conversation.createdAt,
      mode: 'RAG-only',
      description: 'This conversation will only use information from your indexed knowledge base'
    });

  } catch (error) {
    console.error('❌ Error starting RAG conversation:', error);
    res.status(500).json({
      error: 'Error starting conversation',
      details: error.message
    });
  }
});

// Updated route to send a message in a RAG-only conversation
app.post('/conversation/message', async (req, res) => {
  try {
    const {
      sessionId,
      message,
      contextLimit = 5,
      minRelevanceScore = 0.3
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`💬 Processing RAG-only message for session: ${sessionId}`);
    console.log(`📝 Message: ${message.substring(0, 100)}...`);

    const result = await generateRAGOnlyResponse(
        sessionId,
        message.trim(),
        contextLimit,
        minRelevanceScore
    );

    res.json({
      success: true,
      response: result.response,
      sessionId: result.sessionId,
      messageCount: result.messageCount,
      ragInfo: {
        hasRelevantContext: result.hasRelevantContext,
        totalSources: result.totalSources,
        minRelevanceScore: result.minRelevanceScore,
        sources: result.sources
      },
      mode: 'RAG-only',
      usage: result.usage
    });

  } catch (error) {
    console.error('❌ Error processing RAG conversation message:', error);
    res.status(500).json({
      error: 'Error processing message',
      details: error.message
    });
  }
});

// Route to check if knowledge base has content for a query (without generating response)
app.post('/conversation/check-knowledge', async (req, res) => {
  try {
    const { query, contextLimit = 5, minRelevanceScore = 0.3 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🔍 Checking knowledge base for: "${query}"`);

    const queryEmbedding = await generateEmbedding(query);
    const matches = await searchInPinecone(queryEmbedding, contextLimit);

    const relevantMatches = matches.filter(match => match.score >= minRelevanceScore);

    const sources = relevantMatches.map(match => ({
      filename: match.metadata.filename,
      score: match.score,
      source_type: match.metadata.source_type || 'unknown',
      document_id: match.metadata.document_id,
      text_preview: match.metadata.text.substring(0, 200) + '...'
    }));

    res.json({
      success: true,
      query: query.trim(),
      hasRelevantContent: relevantMatches.length > 0,
      totalMatches: matches.length,
      relevantMatches: relevantMatches.length,
      minRelevanceScore,
      sources: sources,
      message: relevantMatches.length > 0
          ? `Found ${relevantMatches.length} relevant sources in knowledge base`
          : 'No relevant content found in knowledge base for this query'
    });

  } catch (error) {
    console.error('❌ Error checking knowledge base:', error);
    res.status(500).json({
      error: 'Error checking knowledge base',
      details: error.message
    });
  }
});

// Route to get knowledge base statistics
app.get('/conversation/knowledge-stats', async (req, res) => {
  try {
    // Get document count from Supabase
    const { data: documents, error } = await supabase
        .from('documents')
        .select('id, filename, chunk_count, source_type, created_at')
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate statistics
    const stats = {
      totalDocuments: documents.length,
      totalChunks: documents.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0),
      sourceTypes: {},
      recentDocuments: documents.slice(0, 5),
      oldestDocument: documents.length > 0 ? documents[documents.length - 1] : null,
      newestDocument: documents.length > 0 ? documents[0] : null
    };

    // Count by source type
    documents.forEach(doc => {
      const sourceType = doc.source_type || 'unknown';
      stats.sourceTypes[sourceType] = (stats.sourceTypes[sourceType] || 0) + 1;
    });

    res.json({
      success: true,
      knowledgeBase: stats,
      message: `Knowledge base contains ${stats.totalDocuments} documents with ${stats.totalChunks} searchable chunks`
    });

  } catch (error) {
    console.error('❌ Error getting knowledge base stats:', error);
    res.status(500).json({
      error: 'Error getting knowledge base statistics',
      details: error.message
    });
  }
});

// Updated route to clear conversation history with RAG-only system prompt
app.post('/conversation/:sessionId/clear', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { systemPrompt } = req.body;

    if (!conversations.has(sessionId)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = conversations.get(sessionId);
    const defaultRAGSystemPrompt = `You are a specialized RAG (Retrieval-Augmented Generation) assistant. Your role is to answer questions EXCLUSIVELY based on the indexed documents and web content in the knowledge base.

STRICT RULES:
1. You can ONLY provide information that exists in the indexed knowledge base
2. You MUST NOT use any general knowledge or external information
3. If information is not available in the knowledge base, you MUST clearly state this
4. Always cite your sources when providing information
5. Be helpful within these constraints, but never fabricate or assume information

Your knowledge base contains documents and web content that users have uploaded or scraped. Only reference this content.`;

    // Reset messages but keep session metadata
    conversation.messages = [
      {
        role: 'system',
        content: systemPrompt || defaultRAGSystemPrompt
      }
    ];
    conversation.messageCount = 0;
    conversation.lastActivity = Date.now();
    conversation.ragOnly = true;

    conversations.set(sessionId, conversation);

    res.json({
      success: true,
      message: 'RAG-only conversation history cleared successfully',
      sessionId,
      mode: 'RAG-only'
    });

  } catch (error) {
    console.error('❌ Error clearing RAG conversation:', error);
    res.status(500).json({
      error: 'Error clearing conversation',
      details: error.message
    });
  }
});

// Updated conversation statistics with RAG info
app.get('/conversation/stats', async (req, res) => {
  try {
    const now = Date.now();
    let totalMessages = 0;
    let activeConversations = 0;
    let ragOnlyConversations = 0;

    for (const [sessionId, conversation] of conversations.entries()) {
      totalMessages += conversation.messageCount;
      if (now - conversation.lastActivity < CONVERSATION_TIMEOUT) {
        activeConversations++;
      }
      if (conversation.ragOnly) {
        ragOnlyConversations++;
      }
    }

    // Get knowledge base stats
    const { data: documents, error } = await supabase
        .from('documents')
        .select('chunk_count, source_type');

    let knowledgeBaseStats = null;
    if (!error && documents) {
      knowledgeBaseStats = {
        totalDocuments: documents.length,
        totalChunks: documents.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0),
        documentTypes: {}
      };

      documents.forEach(doc => {
        const sourceType = doc.source_type || 'unknown';
        knowledgeBaseStats.documentTypes[sourceType] = (knowledgeBaseStats.documentTypes[sourceType] || 0) + 1;
      });
    }

    res.json({
      success: true,
      conversationStats: {
        totalConversations: conversations.size,
        activeConversations,
        ragOnlyConversations,
        totalMessages,
        averageMessagesPerConversation: conversations.size > 0 ? Math.round(totalMessages / conversations.size) : 0
      },
      knowledgeBaseStats,
      systemConfig: {
        maxConversations: MAX_CONVERSATIONS,
        timeoutMinutes: CONVERSATION_TIMEOUT / (60 * 1000),
        defaultMode: 'RAG-only'
      }
    });

  } catch (error) {
    console.error('❌ Error getting conversation stats:', error);
    res.status(500).json({
      error: 'Error getting conversation statistics',
      details: error.message
    });
  }
});

// Route to test RAG system (useful for debugging)
app.post('/conversation/test-rag', async (req, res) => {
  try {
    const { query, contextLimit = 3, minRelevanceScore = 0.3 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required for testing' });
    }

    console.log(`🧪 Testing RAG system with query: "${query}"`);

    // Search for context
    const queryEmbedding = await generateEmbedding(query);
    const matches = await searchInPinecone(queryEmbedding, contextLimit);
    const relevantMatches = matches.filter(match => match.score >= minRelevanceScore);

    let testResponse = '';
    if (relevantMatches.length > 0) {
      const context = relevantMatches
          .map(match => `Source: ${match.metadata.filename}\nContent: ${match.metadata.text}`)
          .join('\n\n---\n\n');

      // Generate a test response
      const testPrompt = `Based ONLY on the following knowledge base content, answer this question: "${query}"

Knowledge base content:
${context}

If the answer is not in the provided content, state that clearly.`;

      const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are a RAG assistant that can only use the provided knowledge base content. Never use external knowledge.'
              },
              {
                role: 'user',
                content: testPrompt
              }
            ],
            max_tokens: 800,
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
      );

      testResponse = response.data.choices[0].message.content;
    } else {
      testResponse = "I don't have information about this in my knowledge base.";
    }

    res.json({
      success: true,
      testQuery: query,
      ragResults: {
        totalMatches: matches.length,
        relevantMatches: relevantMatches.length,
        minRelevanceScore,
        hasRelevantContext: relevantMatches.length > 0,
        sources: relevantMatches.map(match => ({
          filename: match.metadata.filename,
          score: match.score,
          preview: match.metadata.text.substring(0, 100) + '...'
        }))
      },
      testResponse,
      message: relevantMatches.length > 0
          ? 'RAG system found relevant context and generated response'
          : 'RAG system found no relevant context - would return "no information" response'
    });

  } catch (error) {
    console.error('❌ Error testing RAG system:', error);
    res.status(500).json({
      error: 'Error testing RAG system',
      details: error.message
    });
  }
});

// Update the original getConversation function to use RAG-only mode
const getConversation = (sessionId) => {
  if (!conversations.has(sessionId)) {
    return createRAGConversation(sessionId); // Use RAG-only conversation by default
  }

  const conversation = conversations.get(sessionId);
  conversation.lastActivity = Date.now();
  return conversation;
};



// ============= RAG CONFIGURATION =============
const RAG_CONFIG = {
  MAX_CONTEXT_LENGTH: 4000, // Maximum characters for context
  MAX_CHUNKS_PER_CLUSTER: 3, // Maximum chunks to retrieve per cluster
  MAX_CLUSTERS_AUTO: 2, // Maximum clusters to search in auto mode
  MIN_SIMILARITY_THRESHOLD: 0.6, // Minimum similarity to include cluster
  CLUSTER_WEIGHT_FACTOR: 0.3, // How much cluster relevance affects final ranking
  DEFAULT_TEMPERATURE: 0.7,
  MAX_RESPONSE_TOKENS: 500
};

// ============= HELPER FUNCTIONS =============

// Calculate similarity between query and cluster centroid
const calculateClusterRelevance = async (queryEmbedding, clusterId) => {
  try {
    // Get cluster centroid from database or calculate from documents
    const { data: clusterDocs, error } = await supabase
        .from('documents')
        .select('document_embedding')
        .eq('cluster_id', clusterId)
        .not('document_embedding', 'is', null);

    if (error || !clusterDocs.length) {
      return 0;
    }

    // Calculate average embedding for cluster (centroid)
    const embeddings = clusterDocs.map(doc => JSON.parse(doc.document_embedding));
    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);

    embeddings.forEach(embedding => {
      embedding.forEach((value, index) => {
        centroid[index] += value;
      });
    });

    centroid.forEach((value, index) => {
      centroid[index] = value / embeddings.length;
    });

    return calculateDocumentSimilarity(queryEmbedding, centroid);
  } catch (error) {
    console.error(`Error calculating cluster relevance for ${clusterId}:`, error);
    return 0;
  }
};

// Get relevant clusters for a query
const getRelevantClusters = async (queryEmbedding, maxClusters = RAG_CONFIG.MAX_CLUSTERS_AUTO) => {
  try {
    // Get unique cluster_id and cluster_name pairs
    const { data: documents, error } = await supabase
        .from('documents')
        .select('cluster_id, cluster_name')
        .not('cluster_id', 'is', null);

    if (error) throw error;

    // Deduplicate in JavaScript to simulate GROUP BY
    const clusters = Array.from(
        new Map(
            documents.map(doc => [doc.cluster_id, { cluster_id: doc.cluster_id, cluster_name: doc.cluster_name }])
        ).values()
    );

    // Calculate relevance for each cluster
    const clusterRelevance = await Promise.all(
        clusters.map(async (cluster) => {
          const relevance = await calculateClusterRelevance(queryEmbedding, cluster.cluster_id);
          return {
            ...cluster,
            relevance,
          };
        })
    );

    // Sort by relevance and limit to maxClusters
    return clusterRelevance
        .filter(cluster => cluster.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, maxClusters);
  } catch (error) {
    throw new Error(`Error getting relevant clusters: ${error.message}`);
  }
};

// Retrieve context from specific clusters
const retrieveClusterContext = async (queryEmbedding, clusterIds, maxChunksPerCluster = RAG_CONFIG.MAX_CHUNKS_PER_CLUSTER) => {
  const contextChunks = [];

  for (const clusterId of clusterIds) {
    try {
      // Get documents in this cluster
      const { data: clusterDocs, error } = await supabase
          .from('documents')
          .select('id')
          .eq('cluster_id', clusterId);

      if (error || !clusterDocs.length) continue;

      const documentIds = clusterDocs.map(doc => doc.id);

      // Query Pinecone for relevant chunks in this cluster
      const response = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: maxChunksPerCluster,
        filter: { document_id: { $in: documentIds } },
        includeMetadata: true
      });

      // Add cluster info to each chunk
      const clusterChunks = response.matches.map(match => ({
        ...match,
        cluster_id: clusterId,
        cluster_name: clusterDocs[0]?.cluster_name || 'Unknown'
      }));

      contextChunks.push(...clusterChunks);

    } catch (error) {
      console.error(`Error retrieving context from cluster ${clusterId}:`, error);
    }
  }

  return contextChunks;
};

// Rank and deduplicate context chunks
const rankAndDeduplicateContext = (chunks, queryEmbedding) => {
  // Remove duplicates based on text content
  const uniqueChunks = chunks.filter((chunk, index, self) =>
      index === self.findIndex(c => c.metadata.text === chunk.metadata.text)
  );

  // Re-rank considering both semantic similarity and cluster relevance
  const rankedChunks = uniqueChunks.map(chunk => {
    // Original Pinecone score + cluster bonus
    const clusterBonus = chunk.cluster_relevance || 0;
    const finalScore = chunk.score + (clusterBonus * RAG_CONFIG.CLUSTER_WEIGHT_FACTOR);

    return {
      ...chunk,
      final_score: finalScore
    };
  });

  // Sort by final score and limit context length
  rankedChunks.sort((a, b) => b.final_score - a.final_score);

  // Trim to context length limit
  let totalLength = 0;
  const contextLimitedChunks = [];

  for (const chunk of rankedChunks) {
    const chunkLength = chunk.metadata.text.length;
    if (totalLength + chunkLength <= RAG_CONFIG.MAX_CONTEXT_LENGTH) {
      contextLimitedChunks.push(chunk);
      totalLength += chunkLength;
    } else {
      break;
    }
  }

  return contextLimitedChunks;
};

// Generate RAG response using OpenAI
const generateRAGResponse = async (query, contextChunks, clustersUsed) => {
  try {
    // Prepare context from chunks
    const contextText = contextChunks.map((chunk, index) =>
        `[${index + 1}] From "${chunk.metadata.filename}" (${chunk.cluster_name}):\n${chunk.metadata.text}`
    ).join('\n\n');

    const clusterInfo = clustersUsed.map(c => c.cluster_name).join(', ');

    const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided document context. 

The context comes from the following document clusters: ${clusterInfo}

Guidelines:
- Answer based primarily on the provided context
- If the context doesn't fully answer the question, acknowledge this
- Reference specific sources when making claims
- Be concise but comprehensive
- If information comes from different clusters, synthesize it appropriately`;

    const userPrompt = `Context:\n${contextText}\n\nQuestion: ${query}\n\nAnswer:`;

    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: RAG_CONFIG.MAX_RESPONSE_TOKENS,
          temperature: RAG_CONFIG.DEFAULT_TEMPERATURE
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
    );

    return response.data.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error generating RAG response:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
};

// ============= RAG ROUTES =============

// Main RAG endpoint with cluster awareness
app.post('/rag', async (req, res) => {
  try {
    const {
      query,
      cluster_id = null,
      max_clusters = RAG_CONFIG.MAX_CLUSTERS_AUTO,
      context_limit = RAG_CONFIG.MAX_CHUNKS_PER_CLUSTER,
      include_cluster_info = true,
      temperature = RAG_CONFIG.DEFAULT_TEMPERATURE
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🧠 RAG Query: "${query}"${cluster_id ? ` [Cluster: ${cluster_id}]` : ' [Auto-routing]'}`);

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    let clustersToSearch = [];
    let relevantClusters = [];

    if (cluster_id) {
      // Explicit cluster selection
      const { data: clusterInfo, error } = await supabase
          .from('documents')
          .select('cluster_id, cluster_name')
          .eq('cluster_id', cluster_id)
          .limit(1)
          .single();

      if (error || !clusterInfo) {
        return res.status(404).json({
          error: 'Cluster not found',
          cluster_id
        });
      }

      clustersToSearch = [cluster_id];
      relevantClusters = [{ ...clusterInfo, relevance: 1.0 }];

    } else {
      // Smart cluster routing
      relevantClusters = await getRelevantClusters(queryEmbedding, max_clusters);

      if (relevantClusters.length === 0) {
        // Fallback to regular search if no relevant clusters found
        console.log('⚠️ No relevant clusters found, falling back to global search');

        const response = await pineconeIndex.query({
          vector: queryEmbedding,
          topK: context_limit,
          includeMetadata: true
        });

        const fallbackChunks = response.matches.map(match => ({
          ...match,
          cluster_id: null,
          cluster_name: 'Global Search'
        }));

        const ragResponse = await generateRAGResponse(query, fallbackChunks, [{ cluster_name: 'Global Search' }]);

        return res.json({
          success: true,
          query,
          response: ragResponse,
          method: 'global_fallback',
          clusters_searched: [],
          sources: fallbackChunks.map(chunk => ({
            filename: chunk.metadata.filename,
            chunk_index: chunk.metadata.chunk_index,
            score: chunk.score,
            cluster_name: 'Global Search'
          }))
        });
      }

      clustersToSearch = relevantClusters.map(c => c.cluster_id);
    }

    console.log(`🎯 Searching clusters: ${relevantClusters.map(c => c.cluster_name).join(', ')}`);

    // Retrieve context from selected clusters
    const contextChunks = await retrieveClusterContext(queryEmbedding, clustersToSearch, context_limit);

    if (contextChunks.length === 0) {
      return res.json({
        success: false,
        query,
        error: 'No relevant context found in selected clusters',
        clusters_searched: relevantClusters.map(c => ({ id: c.cluster_id, name: c.cluster_name }))
      });
    }

    // Add cluster relevance to chunks for better ranking
    const chunksWithRelevance = contextChunks.map(chunk => {
      const clusterRelevance = relevantClusters.find(c => c.cluster_id === chunk.cluster_id)?.relevance || 0;
      return { ...chunk, cluster_relevance: clusterRelevance };
    });

    // Rank and deduplicate context
    const finalContext = rankAndDeduplicateContext(chunksWithRelevance, queryEmbedding);

    // Generate RAG response
    const ragResponse = await generateRAGResponse(query, finalContext, relevantClusters);

    // Prepare response
    const response = {
      success: true,
      query,
      response: ragResponse,
      method: cluster_id ? 'explicit_cluster' : 'auto_routing',
      total_context_chunks: finalContext.length,
      clusters_searched: relevantClusters.map(c => ({
        id: c.cluster_id,
        name: c.cluster_name,
        relevance: c.relevance
      }))
    };

    if (include_cluster_info) {
      response.sources = finalContext.map(chunk => ({
        filename: chunk.metadata.filename,
        document_id: chunk.metadata.document_id,
        chunk_index: chunk.metadata.chunk_index,
        score: chunk.score,
        final_score: chunk.final_score,
        cluster_id: chunk.cluster_id,
        cluster_name: chunk.cluster_name,
        text_preview: chunk.metadata.text.substring(0, 200) + '...'
      }));

      response.context_stats = {
        total_characters: finalContext.reduce((sum, chunk) => sum + chunk.metadata.text.length, 0),
        chunks_per_cluster: relevantClusters.map(cluster => ({
          cluster_name: cluster.cluster_name,
          chunk_count: finalContext.filter(chunk => chunk.cluster_id === cluster.cluster_id).length
        }))
      };
    }

    console.log(`✅ RAG response generated using ${finalContext.length} chunks from ${relevantClusters.length} clusters`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error in RAG endpoint:', error);
    res.status(500).json({
      error: 'Error generating RAG response',
      details: error.message
    });
  }
});

// Batch RAG endpoint for multiple queries
app.post('/rag-batch', async (req, res) => {
  try {
    const { queries, cluster_id = null, max_clusters = RAG_CONFIG.MAX_CLUSTERS_AUTO } = req.body;

    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: 'Queries array is required' });
    }

    if (queries.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 queries allowed per batch' });
    }

    console.log(`🧠 Batch RAG: Processing ${queries.length} queries`);

    const results = [];

    for (const query of queries) {
      try {
        // Reuse the main RAG logic
        const mockReq = {
          body: {
            query,
            cluster_id,
            max_clusters,
            include_cluster_info: false
          }
        };

        // This is a simplified approach - in production, you'd want to optimize
        // by generating embeddings in parallel and reusing cluster calculations
        const ragResult = await generateRAGForQuery(query, cluster_id, max_clusters);
        results.push({
          query,
          ...ragResult
        });

      } catch (error) {
        results.push({
          query,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      total_queries: queries.length,
      results
    });

  } catch (error) {
    console.error('❌ Error in batch RAG endpoint:', error);
    res.status(500).json({
      error: 'Error processing batch RAG request',
      details: error.message
    });
  }
});

// RAG configuration endpoint
app.get('/rag-config', (req, res) => {
  res.json({
    success: true,
    config: RAG_CONFIG,
    available_models: ['gpt-3.5-turbo', 'gpt-4'],
    cluster_count: null // This could be populated with current cluster count
  });
});

// Update RAG configuration
app.put('/rag-config', (req, res) => {
  try {
    const updates = req.body;

    // Validate configuration updates
    const allowedKeys = Object.keys(RAG_CONFIG);
    const invalidKeys = Object.keys(updates).filter(key => !allowedKeys.includes(key));

    if (invalidKeys.length > 0) {
      return res.status(400).json({
        error: 'Invalid configuration keys',
        invalid_keys: invalidKeys,
        allowed_keys: allowedKeys
      });
    }

    // Apply updates
    Object.assign(RAG_CONFIG, updates);

    res.json({
      success: true,
      message: 'RAG configuration updated',
      config: RAG_CONFIG
    });

  } catch (error) {
    console.error('❌ Error updating RAG config:', error);
    res.status(500).json({
      error: 'Error updating configuration',
      details: error.message
    });
  }
});

// Helper function for batch processing (simplified version of main RAG logic)
const generateRAGForQuery = async (query, clusterId = null, maxClusters = RAG_CONFIG.MAX_CLUSTERS_AUTO) => {
  const queryEmbedding = await generateEmbedding(query);

  let clustersToSearch = [];
  let relevantClusters = [];

  if (clusterId) {
    const { data: clusterInfo } = await supabase
        .from('documents')
        .select('cluster_id, cluster_name')
        .eq('cluster_id', clusterId)
        .limit(1)
        .single();

    if (!clusterInfo) {
      throw new Error('Cluster not found');
    }

    clustersToSearch = [clusterId];
    relevantClusters = [{ ...clusterInfo, relevance: 1.0 }];
  } else {
    relevantClusters = await getRelevantClusters(queryEmbedding, maxClusters);
    clustersToSearch = relevantClusters.map(c => c.cluster_id);
  }

  if (clustersToSearch.length === 0) {
    throw new Error('No relevant clusters found');
  }

  const contextChunks = await retrieveClusterContext(queryEmbedding, clustersToSearch);

  if (contextChunks.length === 0) {
    throw new Error('No relevant context found');
  }

  const finalContext = rankAndDeduplicateContext(contextChunks, queryEmbedding);
  const ragResponse = await generateRAGResponse(query, finalContext, relevantClusters);

  return {
    success: true,
    response: ragResponse,
    method: clusterId ? 'explicit_cluster' : 'auto_routing',
    clusters_used: relevantClusters.length
  };
};


// Serve static files from Vue build
app.use(express.static(path.join(__dirname, 'dist')));

// Handle Vue.js routing - ALL non-API routes return index.html
// This MUST be after all API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api') ||
      req.path.startsWith('/upload') ||
      req.path.startsWith('/search') ||
      req.path.startsWith('/generate') ||
      req.path.startsWith('/documents') ||
      req.path.startsWith('/scrape') ||
      req.path.startsWith('/research') ||
      req.path.startsWith('/conversation') ||
      req.path.startsWith('/cluster') ||
      req.path.startsWith('/rag') ||
      req.path.startsWith('/memory') ||
      req.path.startsWith('/supported-formats')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    available_endpoints: [
      '/upload', '/scrape', '/scrape-multiple', '/scrape-test', '/search', '/generate',
      '/documents', '/memory', '/scraping-stats', '/supported-formats',
      '/conversation/start', '/conversation/message', '/conversation/:id/history',
      '/conversation/:id/clear', '/conversations', '/conversation/stats'
    ]
  });
});



// ============= ADDITIONAL UTILITY ROUTES =============

// Health check for research system
app.get('/research/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      serpapi: !!process.env.SERPAPI_KEY,
      supabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
      pinecone: !!process.env.PINECONE_API_KEY
    },
    timestamp: new Date().toISOString()
  });
});

// Test route for debugging
app.post('/research/test', async (req, res) => {
  try {
    const { query = "artificial intelligence" } = req.body;

    console.log(`🧪 Testing research system with query: "${query}"`);

    // Test query analysis
    const analysis = await analyzeUserQuery(query);

    res.json({
      success: true,
      test_results: {
        query_analysis: analysis,
        environment_check: {
          openai_key: !!process.env.OPENAI_API_KEY,
          serpapi_key: !!process.env.SERPAPI_KEY,
          supabase_configured: !!process.env.SUPABASE_URL,
          pinecone_configured: !!process.env.PINECONE_API_KEY
        }
      },
      message: "Research system test completed successfully"
    });

  } catch (error) {
    console.error('❌ Research test error:', error);
    res.status(500).json({
      success: false,
      error: 'Research system test failed',
      details: error.message
    });
  }
});

// ============= ERROR HANDLING MIDDLEWARE =============

// Research-specific error handler
app.use('/research', (err, req, res, next) => {
  console.error('❌ Research system error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message
    });
  }

  if (err.name === 'TimeoutError') {
    return res.status(408).json({
      success: false,
      error: 'Request timeout',
      details: 'The research request took too long to process'
    });
  }

  if (err.response && err.response.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      details: 'Too many requests. Please try again later.'
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Internal research system error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============= DEPENDENCIES CHECK =============

// Function to check if all required functions exist
const checkDependencies = () => {
  const requiredFunctions = [
    'scrapeWebpage',
    'splitTextIntoChunks',
    'saveToSupabase',
    'processBatch',
    'indexInPineconeBatch',
    'generateEmbedding',
    'searchInPinecone'
  ];

  const missingFunctions = [];

  requiredFunctions.forEach(funcName => {
    if (typeof global[funcName] !== 'function' && typeof this[funcName] !== 'function') {
      missingFunctions.push(funcName);
    }
  });

  if (missingFunctions.length > 0) {
    console.warn('⚠️  Warning: The following required functions are not defined:');
    missingFunctions.forEach(func => console.warn(`   - ${func}`));
    console.warn('   Make sure these functions are implemented in your codebase.');
  }

  return missingFunctions.length === 0;
};

// Check dependencies on startup
checkDependencies();

console.log('✅ Auto-Research System loaded successfully');
// Démarrage du serveur
const startServer = async () => {
  try {
    await initializePinecone();
    await initializeBrowser();

    app.listen(PORT, () => {
      console.log(`🚀 Serveur RAG avec Web Scraping démarré sur le port ${PORT}`);
      console.log(`📡 API disponible sur: http://localhost:${PORT}`);
      console.log(`📁 Endpoints disponibles:`);
      console.log(`   POST /upload - Upload et traitement de documents`);
      console.log(`   POST /scrape - Scraper une page web`);
      console.log(`   POST /scrape-multiple - Scraper plusieurs pages`);
      console.log(`   POST /scrape-test - Tester le scraping d'une URL`);
      console.log(`   POST /search - Recherche sémantique`);
      console.log(`   POST /generate - Génération RAG`);
      console.log(`   GET /documents - Liste des documents`);
      console.log(`   DELETE /documents/:id - Suppression d'un document`);
      console.log(`   GET /memory - Statistiques mémoire`);
      console.log(`   GET /scraping-stats - Statistiques de scraping`);
      console.log(`   GET /supported-formats - supported-formats de fichier`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

// Gestion propre de l'arrêt du serveur
const gracefulShutdown = async () => {
  console.log('\n🛑 Arrêt du serveur...');

  if (browserInstance) {
    console.log('🔄 Fermeture du navigateur Puppeteer...');
    await browserInstance.close();
  }

  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Gestion des erreurs de mémoire
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non gérée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  process.exit(1);
});