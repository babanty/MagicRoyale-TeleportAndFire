using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MagicRoyale_TeleportAndFire.App
{
    public class UsersManager : IUsersManager
    {
        private readonly MagicRoyaleDbContext _dbContext;

        public UsersManager(MagicRoyaleDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<User> Create(Entity.CreateUserRequest request)
        {
            var entity = new User { Name = request.Name };

            _dbContext.Users.Add(entity);
            await _dbContext.SaveChangesAsync();

            return entity;
        }

    }
}
