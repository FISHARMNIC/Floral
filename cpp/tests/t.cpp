#include "../runtime/runtime.hpp"
#include <cstdint>
#include <cstdio>
#include <string>

inline Daisy::String expensesCSV = "100,200,515,185";


int main() {
Daisy::print(Daisy::util::listreduce(Daisy::util::listmap(Daisy::util::strsplit(expensesCSV, ","), [&](auto a){ return Daisy::util::strtoint(a); }), [&](auto ac, auto e){ return ac + e; }));
  Daisy::Threads::join_all();
  return 0;
}
