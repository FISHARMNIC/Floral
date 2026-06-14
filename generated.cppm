
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
            Daisy::LocalList<Daisy::Byte> pixels;
Daisy::Integer width;
Daisy::Integer height;
            };
DAISY_FUNCTION(void, drawPixel, Daisy::_Shared<ImageFrame> image, Daisy::Integer x, Daisy::Integer y, Daisy::_Local<Color> col)
image->value.pixels.get()[(y * image->value.width + x) * static_cast<Daisy::Integer>(3) + static_cast<Daisy::Integer>(0)] = col.get().red;
image->value.pixels.get()[(y * image->value.width + x) * static_cast<Daisy::Integer>(3) + static_cast<Daisy::Integer>(1)] = col.get().green;
image->value.pixels.get()[(y * image->value.width + x) * static_cast<Daisy::Integer>(3) + static_cast<Daisy::Integer>(2)] = col.get().blue;

}
DAISY_FUNCTION(void, createImage, Daisy::_Shared<ImageFrame> image)
auto str = "out.png";
stbi_write_png(str, image->value.width, image->value.height, static_cast<Daisy::Integer>(3), Daisy::util::listptr(image->value.pixels.get()), image->value.width * static_cast<Daisy::Integer>(3));
Daisy::builtin::io::print(("Image generated at '" + Daisy::util::toString(str) + "'"));

}
export Daisy::Integer num_workers = {};
export Daisy::Integer out_width = {};
export Daisy::Integer out_height = {};
export Daisy::Integer iters = {};
export Daisy::Float start_re = {};
export Daisy::Float start_im = {};
export Daisy::Float width_re = {};
export Daisy::Float height_im = {};
export Daisy::LocalList<Daisy::Byte> pixels = {};
export Daisy::_Shared<ImageFrame> fullImage = {};
DAISY_FUNCTION(Daisy::Integer, compute_point, Daisy::Float x, Daisy::Float y)
auto start = Daisy::util::complex_new(x, y);
auto z = Daisy::util::complex_new(static_cast<Daisy::Float>(0), static_cast<Daisy::Float>(0));
for (Daisy::Integer i = 0; i < iters; i++) {
z = z * z + start;
auto re = Daisy::util::complex_real(z);
auto im = Daisy::util::complex_imag(z);
if ((re * re + im * im) > static_cast<Daisy::Integer>(4)) {
return i;
}
}
return static_cast<Daisy::Integer>(255);

}
export Daisy::Float sx = {};
export Daisy::Float sy = {};
export Daisy::SharedInteger dc = {};
DAISY_FUNCTION(void, computer, Daisy::Integer start_y, Daisy::Integer height)
auto fin = start_y + height;
auto draw_y = start_y;
auto compute_y = draw_y * sy + start_im;
while (draw_y < fin) {
auto draw_x = static_cast<Daisy::Integer>(0);
auto compute_x = start_re;
while (draw_x < out_width) {
auto res = Daisy::Threads::call(compute_point , compute_x, compute_y);
Daisy::Threads::call(drawPixel, fullImage, draw_x, draw_y, Daisy::_Local<Color>(((Color){.red = Daisy::util::toByte(res),.green = Daisy::util::toByte(res),.blue = Daisy::util::toByte(res)})));
compute_x = compute_x + sx;
draw_x = draw_x + static_cast<Daisy::Integer>(1);
}
compute_y = compute_y + sy;
draw_y = draw_y + static_cast<Daisy::Integer>(1);
}
dc->modify([&](auto __v){ return __v + static_cast<Daisy::Integer>(1); });

}
export Daisy::Integer worker_height = {};
export Daisy::LocalList<Daisy::Threads::Handler<void>> workers = {};


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/longer/mandlebrot/main.bud";

;
;
num_workers = static_cast<Daisy::Integer>(40);
out_width = static_cast<Daisy::Integer>(1000);
out_height = static_cast<Daisy::Integer>(1000);
iters = static_cast<Daisy::Integer>(600);
start_re = static_cast<Daisy::Float>(0.28);
start_im = static_cast<Daisy::Float>(0.005);
width_re = static_cast<Daisy::Float>(0.02);
height_im = static_cast<Daisy::Float>(0.02);
Daisy::util::listresize(pixels.get(), out_width * out_height * static_cast<Daisy::Integer>(3));
fullImage = Daisy::NewShared(Daisy::_Local<ImageFrame>(((ImageFrame){.pixels = pixels,.width = out_width,.height = out_height})).get());
sx = width_re / out_width;
sy = height_im / out_height;
dc = Daisy::NewShared(static_cast<Daisy::Integer>(0));
worker_height = out_height / num_workers;
for (Daisy::Integer i = 0; i < num_workers; i++) {
Daisy::util::listpush(workers.get(), Daisy::Threads::spawn(computer, worker_height * i, worker_height));
}
for (Daisy::Integer i = 0; i < num_workers; i++) {
workers.get()[i].await();
}
Daisy::Threads::call(createImage, fullImage);


Daisy::Threads::join_all();
return 0;
}
}
