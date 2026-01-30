export const CLOUDINARY_CLOUD_NAME = "di9ht8cie";
export const CLOUDINARY_UPLOAD_PRESET = "soulnotes";

export const uploadImageToCloudinary = async (
  imageUri: string,
): Promise<string> => {
  const formData = new FormData();

  formData.append("file", {
    uri: imageUri,
    name: `profile_${Date.now()}.jpg`,
    type: "image/jpeg",
  } as any);

  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Image upload failed");
    }

    if (!data.secure_url) {
      throw new Error("No secure URL returned from Cloudinary");
    }

    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};
