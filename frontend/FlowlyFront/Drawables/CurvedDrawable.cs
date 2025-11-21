using Microsoft.Maui.Graphics;

namespace FlowlyFront.Drawables
{
    public class CurvedDrawable : IDrawable
    {
        public void Draw(ICanvas canvas, RectF dirtyRect)
        {
            float width = (float)dirtyRect.Width;
            float height = (float)dirtyRect.Height;

            canvas.FillColor = Color.FromArgb("#FFF9F4");

            var path = new PathF();
            path.MoveTo(0, height * 0.3f);
            path.QuadTo(width / 2, height * 1.2f, width, height * 0.3f);
            path.LineTo(width, height);
            path.LineTo(0, height);
            path.Close();

            canvas.FillPath(path);
        }
    }
}
