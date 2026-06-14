
module;
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

export module main;


export struct Vec3 {
            Daisy::Float x;
Daisy::Float y;
Daisy::Float z;
            };

export struct Color {
            Daisy::Byte red;
Daisy::Byte green;
Daisy::Byte blue;
            };

export struct ImageFrame {
            Daisy::List<Daisy::Byte> pixels;
Daisy::Integer width;
Daisy::Integer height;
            };
DAISY_FUNCTION(void, drawPixel, const ImageFrame& image, Daisy::Integer x, Daisy::Integer y, const Color& col)
image.pixels[(y * image.width + x) * static_cast<Daisy::Integer>(3) + static_cast<Daisy::Integer>(0)] = col.red;
image.pixels[(y * image.width + x) * static_cast<Daisy::Integer>(3) + static_cast<Daisy::Integer>(1)] = col.green;
image.pixels[(y * image.width + x) * static_cast<Daisy::Integer>(3) + static_cast<Daisy::Integer>(2)] = col.blue;

}
DAISY_FUNCTION(void, createImage, const ImageFrame& image)
auto str = "out.png";
stbi_write_png(str, image.width, image.height, static_cast<Daisy::Integer>(3), Daisy::util::listptr(image.pixels), image.width * static_cast<Daisy::Integer>(3));
Daisy::builtin::io::print(("Image generated at '" + Daisy::util::toString(str) + "'"));

}
export Daisy::Integer out_width = {};
export Daisy::Integer out_height = {};
export Daisy::List<Daisy::Byte> pixels = {};
export ImageFrame fullImage = {};


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/longer/raytracer/main.bud";

;
;
out_width = static_cast<Daisy::Integer>(400);
out_height = static_cast<Daisy::Integer>(400);
Daisy::util::listresize(pixels, out_width * out_height * static_cast<Daisy::Integer>(3));
fullImage = ((ImageFrame){.pixels = pixels,.width = out_width,.height = out_height});
Daisy::Threads::call(drawPixel, fullImage, static_cast<Daisy::Integer>(200), static_cast<Daisy::Integer>(200), ((Color){.red = static_cast<Daisy::Integer>(255),.green = static_cast<Daisy::Integer>(255),.blue = static_cast<Daisy::Integer>(255)}));
Daisy::Threads::call(createImage, fullImage);


Daisy::Threads::join_all();
return 0;
}
}
