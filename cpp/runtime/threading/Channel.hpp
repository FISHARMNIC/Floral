#ifndef THREADS_CHANNEL_H
#define THREADS_CHANNEL_H

#include <atomic>
#include <condition_variable>
#include <cstddef>
#include <memory>
#include <mutex>
#include <queue>
// #include <string>
#include <future>
#include <vector>

#include "../types/Types.hpp"
// #include "Spawn.hpp"

#define __DT_NOSPAWN "__DT_NO_SPAWN"

namespace Daisy {
namespace Threads {

struct _Channel {
    std::queue<Daisy::String> s2m; // spawn -> main
    std::queue<Daisy::String> m2s; // main -> spawn

    std::mutex mtx_s2m;
    std::mutex mtx_m2s;

    std::condition_variable cv_s2m;
    std::condition_variable cv_m2s;

    std::vector<std::future<void>> detached_futures;

    // @todo does this need to be share since _Channel is only used as a sharedptr
    std::shared_ptr<std::atomic<bool>> killchild;

    _Channel() : killchild(std::make_shared<std::atomic<bool>>(false)) {}

};

// Comms to child
struct MasterChannel {
    std::shared_ptr<_Channel> channel;
    // public:

    MasterChannel(std::shared_ptr<_Channel> ch = 0) : channel(ch) {}

    void send(const Daisy::String &msg)
    {
        {
            std::lock_guard<std::mutex> lock(channel->mtx_m2s);
            channel->m2s.push(msg);
        }
        channel->cv_m2s.notify_one();
    }

    Daisy::String receive()
    {
        std::unique_lock<std::mutex> lock(channel->mtx_s2m);
        channel->cv_s2m.wait(lock, [this] { return !channel->s2m.empty(); });
        Daisy::String msg = channel->s2m.front();
        channel->s2m.pop();
        return msg;
    }

    Daisy::Integer pending()
    {
        std::unique_lock<std::mutex> lock(channel->mtx_s2m);
        return channel->s2m.size();
    }

    Daisy::Bool canReceive() { return pending() != 0; }
};

// Comms to parent
struct SlaveChannel {
    std::shared_ptr<_Channel> channel;
    bool isSpawned = false;
    // public:
    SlaveChannel(std::shared_ptr<_Channel> ch, bool spawned = false) : channel(ch), isSpawned(spawned) {}

    void send(const Daisy::String &msg = "")
    {
        if (!isSpawned) return;
        std::lock_guard<std::mutex> lock(channel->mtx_s2m);
        channel->s2m.push(msg);
        channel->cv_s2m.notify_one();
    }

    Daisy::String receive()
    { // @todo def shouldnt be in here
        if (!isSpawned) return __DT_NOSPAWN;
        std::unique_lock<std::mutex> lock(channel->mtx_m2s);
        channel->cv_m2s.wait(lock, [this] { return !channel->m2s.empty(); });
        Daisy::String msg = channel->m2s.front();
        channel->m2s.pop();
        return msg;
    }

    Daisy::Integer pending()
    {
        if (!isSpawned) return 0;
        std::unique_lock<std::mutex> lock(channel->mtx_m2s);
        return channel->m2s.size();
    }

    Daisy::Bool canReceive() { return pending() != 0; }
};

extern thread_local SlaveChannel activeSlaveChannel;

inline void checkAlive()
{
    if (activeSlaveChannel.channel->killchild->load()) {
        throw _CancelledException();
    }
};

inline std::pair<MasterChannel, SlaveChannel> make_channel()
{
    auto ch = std::make_shared<_Channel>();
    return {MasterChannel(ch), SlaveChannel(ch, true)};
}
} // namespace Threads
} // namespace Daisy

#endif