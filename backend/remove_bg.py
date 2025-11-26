from PIL import Image, ImageDraw

def remove_white_background(input_path, output_path):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        # Create a mask for the background using floodfill
        # We assume the top-left pixel is background color
        # Threshold allows for slight off-white variations
        ImageDraw.floodfill(img, (0, 0), (0, 0, 0, 0), thresh=50)
        
        # Also try other corners in case the image has disconnected white regions in corners
        width, height = img.size
        ImageDraw.floodfill(img, (width-1, 0), (0, 0, 0, 0), thresh=50)
        ImageDraw.floodfill(img, (0, height-1), (0, 0, 0, 0), thresh=50)
        ImageDraw.floodfill(img, (width-1, height-1), (0, 0, 0, 0), thresh=50)

        # Crop the image to the bounding box of the non-transparent content
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)

        img.save(output_path, "PNG")
        print(f"Successfully saved transparent icon to {output_path}")
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    input_file = "../frontend/synergy_icon.png"
    output_file = "../frontend/synergy_icon_transparent.png"
    remove_white_background(input_file, output_file)

