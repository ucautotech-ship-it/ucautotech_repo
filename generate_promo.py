from PIL import Image, ImageDraw, ImageFont
import os

def create_ucautotech_flyer():
    # Create a high-resolution dark metallic corporate canvas
    width, height = 1200, 1200
    image = Image.new("RGB", (width, height), color=(15, 20, 25))
    draw = ImageDraw.Draw(image)

    # Draw vibrant accent header banner (Electric Green & Deep Blue)
    draw.rectangle([(0, 0), (width, 180)], fill=(0, 200, 83))
    draw.rectangle([(0, 170), (width, 180)], fill=(255, 215, 0)) # Gold trim line

    # Load system font or default fallback
    try:
        font_title = ImageFont.truetype("/system/fonts/Roboto-Bold.ttf", 46)
        font_subtitle = ImageFont.truetype("/system/fonts/Roboto-Regular.ttf", 26)
        font_body = ImageFont.truetype("/system/fonts/Roboto-Regular.ttf", 28)
        font_header = ImageFont.truetype("/system/fonts/Roboto-Bold.ttf", 36)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_header = ImageFont.load_default()

    # Header Text
    draw.text((50, 45), "UCAUTOTECH VIP AUTOMOTIVE CARE", fill=(15, 20, 25), font=font_title)
    draw.text((50, 110), "Autonomous 24/7 Enterprise Workshop OS 🟢", fill=(15, 20, 25), font=font_subtitle)

    # Body Content Cards
    # Card 1: Tiered Pricing
    draw.rounded_rectangle([(50, 220), (1150, 500)], radius=20, fill=(26, 37, 48), outline=(0, 200, 83), width=3)
    draw.text((80, 250), "💼 TIERED INSPECTION & LABOR PRICING", fill=(255, 215, 0), font=font_header)
    draw.text((80, 310), "• 2015 & Older Models: ₦100,000 Base Fee", fill=(255, 255, 255), font=font_body)
    draw.text((80, 360), "• 2016 & Newer Models: ₦200,000 – ₦300,000", fill=(255, 255, 255), font=font_body)
    draw.text((80, 410), "• Interstate Dispatch: +50% Labor Surcharge Applied", fill=(255, 255, 255), font=font_body)
    draw.text((80, 455), "• Mobility / Transport: Itemized Separately per Location", fill=(200, 220, 240), font=font_body)

    # Card 2: Advanced Services & Subscriptions
    draw.rounded_rectangle([(50, 540), (1150, 850)], radius=20, fill=(26, 37, 48), outline=(0, 200, 83), width=3)
    draw.text((80, 570), "🚀 VIP SUBSCRIPTIONS & ADVANCED TECH", fill=(255, 215, 0), font=font_header)
    draw.text((80, 630), "• AI Diagnostic Trouble Code (DTC) Fault Breakdown", fill=(255, 255, 255), font=font_body)
    draw.text((80, 680), "• Corporate Fleet & Individual VIP Maintenance Plans", fill=(255, 255, 255), font=font_body)
    draw.text((80, 730), "• Automated Electronic Invoicing & UBA Secure Gateway", fill=(255, 255, 255), font=font_body)
    draw.text((80, 785), "• Real-time Telemetry & Live On-Site Technician Dispatch", fill=(255, 255, 255), font=font_body)

    # Footer Branding
    draw.rectangle([(0, 1080), (width, height)], fill=(10, 14, 18))
    draw.text((50, 1120), "📞 Contact & WhatsApp Booking: 24/7 Autonomous Enterprise Service", fill=(0, 200, 83), font=font_subtitle)

    # Save Image
    output_path = "ucautotech_promo.jpg"
    image.save(output_path, "JPEG", quality=95)
    print(f"[STUDIO SUCCESS] Branded promo graphic generated: {output_path}")

create_ucautotech_flyer()
