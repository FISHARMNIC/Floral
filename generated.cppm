
module;
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

export module pool;


export struct PoolEntry {
            std::function<Daisy::Integer(void)> callback;
Daisy::Threads::Handler<Daisy::Integer> handle;
            };


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/longer/pool/pool.bud";



Daisy::Threads::join_all();
return 0;
}
}
