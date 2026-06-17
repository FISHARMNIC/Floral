#include <SDL.h>
#include <inttypes.h>

SDL_Window *window;
SDL_Renderer *renderer;
SDL_Texture *texture;
SDL_Event event;

void cpp_sdl_setup(uint32_t width, uint32_t height)
{
    SDL_Init(SDL_INIT_VIDEO);

    window = SDL_CreateWindow("Mandelbrot", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, width, height, SDL_WINDOW_SHOWN);
    renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
    texture = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_RGB24, SDL_TEXTUREACCESS_STREAMING, width, height);
}

void cpp_sdl_render(const uint8_t* pixels, uint32_t width, uint32_t height)
{
    SDL_UpdateTexture(texture, nullptr, pixels, width * 3);
    SDL_RenderCopy(renderer, texture, nullptr, nullptr);
    SDL_RenderPresent(renderer);
}

void cpp_sdl_stop()
{
    SDL_DestroyTexture(texture);
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    SDL_Quit();
}

// void cpp_sdl_loop()
// {
//     int running = 1;
//     while (running) {
//         while (SDL_PollEvent(&event)) {
//             if (event.type == SDL_QUIT)
//                 running = 0;
//             if (event.type == SDL_KEYDOWN && event.key.keysym.sym == SDLK_ESCAPE)
//                 running = 0;
//         }
//     }
// }