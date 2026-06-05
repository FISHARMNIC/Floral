#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>


struct Person {
            Daisy::String name;
Daisy::Integer age;
            };


int main(int argc, char* argv[]) {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/TODO/struct.bud";

auto p = ((Person){.name = "Alice",.age = static_cast<Daisy::Integer>(30)});
Daisy::builtin::io::print(p.name);


Daisy::Threads::join_all();
return 0;
}
