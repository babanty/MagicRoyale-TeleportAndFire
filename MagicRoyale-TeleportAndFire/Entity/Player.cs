using System;
using System.Collections.Generic;
using System.Text;

namespace MagicRoyale_TeleportAndFire.Entity
{
    public class Player
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string PlayerStatus { get; set; }

        public Player()
        {
            PlayerStatus = "offline";
        }

    }
}
