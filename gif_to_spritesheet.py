import os
import argparse
from PIL import Image
import math

def convert_gif_to_spritesheet(gif_path, output_dir=None):
    """
    Convert a GIF animation to a PNG spritesheet.
    
    Args:
        gif_path (str): Path to the GIF file
        output_dir (str, optional): Directory to save the spritesheet. If None, uses the same directory as the GIF.
    
    Returns:
        str: Path to the created spritesheet
    """
    # Open the GIF file
    gif = Image.open(gif_path)
    
    # Extract filename without extension for naming
    base_filename = os.path.basename(gif_path)
    filename_without_ext = os.path.splitext(base_filename)[0]
    
    # Determine output directory
    if output_dir is None:
        output_dir = os.path.dirname(gif_path)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Get original GIF dimensions
    width, height = gif.size
    
    # Count frames in the GIF
    frames = 0
    try:
        while True:
            gif.seek(frames)
            frames += 1
    except EOFError:
        pass
    
    # Calculate dimensions for the spritesheet
    # Try to make it somewhat square-ish when possible
    cols = math.ceil(math.sqrt(frames))
    rows = math.ceil(frames / cols)
    
    # Create a new image for the spritesheet
    spritesheet = Image.new('RGBA', (width * cols, height * rows), (0, 0, 0, 0))
    
    # Paste each frame into the spritesheet
    for frame in range(frames):
        gif.seek(frame)
        frame_img = gif.convert('RGBA')
        
        # Calculate position in the spritesheet
        x = (frame % cols) * width
        y = (frame // cols) * height
        
        spritesheet.paste(frame_img, (x, y))
    
    # Save the spritesheet
    output_path = os.path.join(output_dir, f"{filename_without_ext}_spritesheet.png")
    spritesheet.save(output_path, 'PNG')
    
    print(f"Created spritesheet: {output_path}")
    return output_path

def process_directory(directory, output_dir=None):
    """
    Process all GIF files in a directory.
    
    Args:
        directory (str): Directory containing GIF files
        output_dir (str, optional): Directory to save spritesheets
    """
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return
    
    # Create output directory if it doesn't exist
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Count processed files
    processed = 0
    
    # Process each GIF file
    for filename in os.listdir(directory):
        if filename.lower().endswith('.gif'):
            gif_path = os.path.join(directory, filename)
            try:
                convert_gif_to_spritesheet(gif_path, output_dir)
                processed += 1
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    
    print(f"Processed {processed} GIF files")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert GIF animations to PNG spritesheets')
    parser.add_argument('input_dir', help='Directory containing GIF files')
    parser.add_argument('--output-dir', '-o', help='Directory to save spritesheets (optional)')
    
    args = parser.parse_args()
    
    process_directory(args.input_dir, args.output_dir)
