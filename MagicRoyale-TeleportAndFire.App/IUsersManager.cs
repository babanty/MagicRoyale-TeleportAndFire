using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MagicRoyale_TeleportAndFire.App
{
    public interface IUsersManager
    {
        public Task<User> Create(Entity.CreateUserRequest request);
    }
}
