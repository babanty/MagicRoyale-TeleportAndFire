using System;
using System.Collections.Generic;
using System.Text;

namespace MagicRoyale_TeleportAndFire.Entity
{
    public class Character
    {
        public Guid WorldId { get; set; } = Guid.NewGuid();
        public decimal X { get; set; }
        public decimal Y { get; set; }
        public decimal Hp { get; set; }
    }
}
