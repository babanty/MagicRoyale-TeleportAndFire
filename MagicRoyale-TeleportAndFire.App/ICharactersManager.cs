using MagicRoyale_TeleportAndFire.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MagicRoyale_TeleportAndFire.App
{
    public interface ICharactersManager
    {
        public Task<Character> Create();
    }
}
