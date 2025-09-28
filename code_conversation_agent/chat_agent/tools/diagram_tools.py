from mermaid_cli import render_mermaid

def convert_mermaid_to_bytes(
    mermaid_code: str
) -> bytes:
    """
    Converts Mermaid diagram code to an image (bytes) using mermaid-cli-python.

    Args:
        mermaid_code: The Mermaid diagram definition string.
        output_format: The desired output format ("png", "svg", or "pdf").
        background_color: The background color of the diagram (e.g., "white", "transparent").
        theme: The Mermaid theme to use (e.g., "default", "forest", "dark", "neutral").
        width: The width of the output image in pixels.
        height: The height of the output image in pixels.

    Returns:
        Bytes containing the image data.
    """
    output_format: str = "png",
    background_color: str = "white",
    theme: str = "default",
    width: int = 800,
    height: int = 600

    try:
        # render_mermaid directly returns the image data as bytes
        _, _, image_data = render_mermaid(
            definition=mermaid_code,
            output_format=output_format,
            background_color=background_color,
            mermaid_config={"theme": theme},
            viewport={"width": width, "height": height}
        )
        return image_data
    except Exception as e:
        print(f"Error converting Mermaid diagram: {e}")
        