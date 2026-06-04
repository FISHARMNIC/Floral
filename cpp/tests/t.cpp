#include "../runtime/runtime.hpp"
#include <cstdint>
#include <cstdio>
#include <string>

inline Daisy::SharedString contents;

int main(int argc, char* argv[]) {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/test.bud";


contents = Daisy::NewShared(Daisy::builtin::file::read(Daisy::builtin::file::resolve("test.bud")));
Daisy::print(contents);


Daisy::Threads::join_all();
return 0;
}
