import { jsPDF } from 'jspdf';

// Cache pour la police
let fontLoaded = false;
let fontData: string | null = null;

// URL de la police Roboto (Google Fonts)
const FONT_URL = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf';

export async function loadRobotoFont(pdf: jsPDF): Promise<void> {
  if (fontLoaded && fontData) {
    // Utiliser le cache
    pdf.addFileToVFS('Roboto-Regular.ttf', fontData);
    pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    return;
  }

  try {
    // Télécharger la police
    const response = await fetch(FONT_URL);
    const arrayBuffer = await response.arrayBuffer();

    // Convertir en base64
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    fontData = btoa(binary);

    // Ajouter à jsPDF
    pdf.addFileToVFS('Roboto-Regular.ttf', fontData);
    pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

    fontLoaded = true;
  } catch (error) {
    console.error('Failed to load Roboto font:', error);
    // Fallback sur Helvetica si erreur
  }
}

// Police Roboto Bold
const FONT_BOLD_URL = 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.ttf';
let fontBoldLoaded = false;
let fontBoldData: string | null = null;

export async function loadRobotoBoldFont(pdf: jsPDF): Promise<void> {
  if (fontBoldLoaded && fontBoldData) {
    pdf.addFileToVFS('Roboto-Bold.ttf', fontBoldData);
    pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    return;
  }

  try {
    const response = await fetch(FONT_BOLD_URL);
    const arrayBuffer = await response.arrayBuffer();

    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    fontBoldData = btoa(binary);

    pdf.addFileToVFS('Roboto-Bold.ttf', fontBoldData);
    pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

    fontBoldLoaded = true;
  } catch (error) {
    console.error('Failed to load Roboto Bold font:', error);
  }
}

// Charger les deux polices
export async function loadRobotoFonts(pdf: jsPDF): Promise<void> {
  await Promise.all([
    loadRobotoFont(pdf),
    loadRobotoBoldFont(pdf),
  ]);
}
