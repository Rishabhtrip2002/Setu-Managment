/**
 * Cloudinary Direct Upload Helper (No Backend Required)
 * Used for PDF Quotations, Invoices, Receipts, and Company Logos.
 * 
 * @param {File|Blob} file File or PDF Blob to upload
 * @param {string} [cloudName] Optional Cloudinary Cloud Name (defaults to import.meta.env.VITE_CLOUDINARY_CLOUD_NAME)
 * @param {string} [uploadPreset] Optional Unsigned Upload Preset (defaults to import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadToCloudinary = async (file, cloudName, uploadPreset) => {
  const cName = cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cName || !preset) {
    throw new Error('Cloudinary Cloud Name or Upload Preset is missing in environment variables.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cName}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to upload to Cloudinary');
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id
  };
};
