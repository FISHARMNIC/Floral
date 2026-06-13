
module;
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

export module main;

export Daisy::Integer img_width = {};
export Daisy::Integer img_height = {};
export Daisy::List<Daisy::Integer> pixels = {};
export Daisy::Integer x = {};
export Daisy::Integer y = {};


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/longer/raytracer/main.bud";

;
;
img_width = static_cast<Daisy::Integer>(400);
img_height = static_cast<Daisy::Integer>(400);
Daisy::util::listresize(pixels, img_width * img_height * static_cast<Daisy::Integer>(3));
x = static_cast<Daisy::Integer>(200);
y = static_cast<Daisy::Integer>(200);
pixels[y * img_width + x * static_cast<Daisy::Integer>(3)] = static_cast<Daisy::Integer>(255);
pixels[y * img_width + x * static_cast<Daisy::Integer>(3) + static_cast<Daisy::Integer>(1)] = static_cast<Daisy::Integer>(255);
pixels[y * img_width + x * static_cast<Daisy::Integer>(3) + static_cast<Daisy::Integer>(2)] = static_cast<Daisy::Integer>(255);
stbi_write_png("out.png", img_width, img_height, static_cast<Daisy::Integer>(3), Daisy::util::listptr(pixels), img_width * static_cast<Daisy::Integer>(3));


Daisy::Threads::join_all();
return 0;
}
}
