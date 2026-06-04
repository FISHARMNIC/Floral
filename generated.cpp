#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

inline Daisy::String path;
inline Daisy::String s;
inline Daisy::SharedInteger GAMMA;
inline Daisy::Integer ALPHA;


int main(int argc, char* argv[]) {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/exec.bud";

path = Daisy::builtin::file::resolve("showcase3.bud");
s = path;
Daisy::print(s);
if (static_cast<Daisy::Integer>(1) == static_cast<Daisy::Integer>(1)) {
auto ALPHA = static_cast<Daisy::Integer>(10);
auto BETA = static_cast<Daisy::Integer>(10);
GAMMA = Daisy::NewShared(static_cast<Daisy::Integer>(10));
}
ALPHA = static_cast<Daisy::Integer>(100);


Daisy::Threads::join_all();
return 0;
}
