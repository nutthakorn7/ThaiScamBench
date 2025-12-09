from PIL import Image, ImageDraw
import numpy as np
import os

def create_test_images():
    print("Generating test images...")
    
    # 1. Plain Red Image (Simple)
    img1 = Image.new('RGB', (512, 512), color='red')
    img1.save('test_simple.jpg', quality=95)
    print("Created test_simple.jpg")
    
    # 2. Noise Image (Simulate high entropy/noise)
    noise = np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8)
    img2 = Image.fromarray(noise)
    img2.save('test_noise.jpg', quality=95)
    print("Created test_noise.jpg")
    
    # 3. Checkerboard (Simulate frequency artifacts)
    img3 = Image.new('RGB', (512, 512), color='white')
    draw = ImageDraw.Draw(img3)
    step = 32
    for y in range(0, 512, step):
        for x in range(0, 512, step):
            if (x//step + y//step) % 2 == 0:
                draw.rectangle([x, y, x+step, y+step], fill='black')
    img3.save('test_grid.jpg', quality=80) 
    print("Created test_grid.jpg")

if __name__ == "__main__":
    create_test_images()
