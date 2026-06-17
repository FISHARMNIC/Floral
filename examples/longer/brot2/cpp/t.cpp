#include <SDL.h>

const int width = 800;
const int height = 800;
// your pixel buffer — same layout as your current Floral pixels array
uint8_t pixels[width * height * 3];

// put_pixel — write RGB into buffer at (x, y)
void put_pixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  int idx = (y * width + x) * 3;
  pixels[idx + 0] = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
}

int main() {
  SDL_Init(SDL_INIT_VIDEO);

  SDL_Window *window =
      SDL_CreateWindow("Mandelbrot", SDL_WINDOWPOS_CENTERED,
                       SDL_WINDOWPOS_CENTERED, width, height, SDL_WINDOW_SHOWN);

  SDL_Renderer *renderer =
      SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
  SDL_Texture *texture =
      SDL_CreateTexture(renderer, SDL_PIXELFORMAT_RGB24,
                        SDL_TEXTUREACCESS_STREAMING, width, height);

  // --- compute your mandelbrot into pixels here ---

  // push buffer to screen
  SDL_UpdateTexture(texture, NULL, pixels,
                    width * 3); // pitch = width * 3 bytes
  SDL_RenderCopy(renderer, texture, NULL, NULL);
  SDL_RenderPresent(renderer);

  // event loop
  SDL_Event e;
  int running = 1;
  while (running) {
    while (SDL_PollEvent(&e)) {
      if (e.type == SDL_QUIT)
        running = 0;
      if (e.type == SDL_KEYDOWN && e.key.keysym.sym == SDLK_ESCAPE)
        running = 0;
    }
  }

  SDL_DestroyTexture(texture);
  SDL_DestroyRenderer(renderer);
  SDL_DestroyWindow(window);
  SDL_Quit();
  return 0;
}