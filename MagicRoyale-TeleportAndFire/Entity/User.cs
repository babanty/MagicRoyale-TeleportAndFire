using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MagicRoyale_TeleportAndFire.App
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; }
    }
}
